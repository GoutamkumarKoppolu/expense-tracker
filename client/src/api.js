// On-device data layer (Dexie/IndexedDB) behind the same function names and
// signatures the old fetch()-based client used, so every calling component
// needs zero changes. Validation and error messages are carried over
// verbatim from server/routes/transactions.js, options.js, and
// creditCards.js for behavioral parity.
import { db } from "./db";
import { isKnownOption, requirePositiveAmount, requireNonEmpty, requireValidLast4 } from "./db/validators";
import { TRANSACTION_KINDS, computeTotals, matchesFilters, normalizeDeductFlag } from "./domain/transactions";

const nowIso = () => new Date().toISOString();

async function kindByTypeNameMap() {
  const types = await db.transaction_types.toArray();
  return Object.fromEntries(types.map((t) => [t.name, t.kind]));
}

async function attachTypeKind(row) {
  const map = await kindByTypeNameMap();
  return { ...row, type_kind: map[row.type] ?? null };
}

function sortByDateDesc(rows) {
  return [...rows].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.created_at < b.created_at ? 1 : -1;
  });
}

async function allTransactionsWithKind() {
  const [rows, map] = await Promise.all([db.transactions.toArray(), kindByTypeNameMap()]);
  return rows.map((t) => ({ ...t, type_kind: map[t.type] ?? null }));
}

// filters: see matchesFilters in domain/transactions.js
export async function fetchTransactions(filters = {}) {
  const rows = await allTransactionsWithKind();
  return sortByDateDesc(rows.filter((t) => matchesFilters(t, filters)));
}

export async function fetchTags() {
  const rows = await db.transactions.toArray();
  return [...new Set(rows.map((t) => t.tag))].sort();
}

export async function fetchOverview() {
  const totals = computeTotals(await allTransactionsWithKind());
  return {
    totalEarnings: totals.earnings,
    totalExpenses: totals.expenses,
    totalSavings: totals.savings,
    balance: totals.balance,
  };
}

const OPTION_KINDS = ["transaction-types", "payment-methods", "payment-sources"];
const TABLE_BY_KIND = {
  "transaction-types": "transaction_types",
  "payment-methods": "payment_methods",
  "payment-sources": "payment_sources",
};
const NOT_FOUND_MESSAGE = {
  "transaction-types": "Transaction type not found",
  "payment-methods": "payment method not found",
  "payment-sources": "payment source not found",
};

export function fetchOptions(kind) {
  return db[TABLE_BY_KIND[kind]].orderBy("name").toArray();
}

export function fetchAllOptions() {
  return Promise.all(OPTION_KINDS.map(fetchOptions)).then((results) =>
    Object.fromEntries(OPTION_KINDS.map((kind, i) => [kind, results[i]]))
  );
}

// `payload` is either a plain name string, or (for transaction-types) an
// object like { name, kind } where kind is 'earning' | 'expense' | 'saving'.
// Mirrors the old API's upsert-by-name semantics (re-adding an existing name
// updates it in place rather than throwing a duplicate-key error).
export async function addOption(kind, payload) {
  const body = typeof payload === "string" ? { name: payload } : payload;
  const name = requireNonEmpty(body.name, "name");
  const table = TABLE_BY_KIND[kind];

  if (kind === "transaction-types") {
    if (!TRANSACTION_KINDS.includes(body.kind)) {
      throw new Error(`kind must be one of ${TRANSACTION_KINDS.join(", ")}`);
    }
    const existing = await db.transaction_types.where("name").equals(name).first();
    if (existing) {
      await db.transaction_types.update(existing.id, { kind: body.kind });
      return db.transaction_types.get(existing.id);
    }
    const id = await db.transaction_types.add({ name, kind: body.kind });
    return db.transaction_types.get(id);
  }

  const existing = await db[table].where("name").equals(name).first();
  if (existing) return existing;
  const id = await db[table].add({ name });
  return db[table].get(id);
}

export async function deleteOption(kind, id) {
  const table = TABLE_BY_KIND[kind];
  const optId = Number(id);
  const existing = await db[table].get(optId);
  if (!existing) throw new Error(NOT_FOUND_MESSAGE[kind]);
  await db[table].delete(optId);
  return null;
}

async function validateTransactionFields({ type, amount, tag, payment_method, payment_source, date }) {
  if (!(await isKnownOption(db, "transaction_types", type))) {
    throw new Error("type must be a known transaction type");
  }
  requirePositiveAmount(amount);
  const trimmedTag = requireNonEmpty(tag, "tag");
  if (!(await isKnownOption(db, "payment_methods", payment_method))) {
    throw new Error("payment_method must be a known payment method");
  }
  if (!(await isKnownOption(db, "payment_sources", payment_source))) {
    throw new Error("payment_source must be a known payment source");
  }
  if (!date) throw new Error("date is required");
  return trimmedTag;
}

async function transactionRecord(data, trimmedTag) {
  const { type, amount, payment_method, payment_source, date, note, deduct_from_balance } = data;
  const kind = (await kindByTypeNameMap())[type];
  return {
    type,
    amount: Number(amount),
    tag: trimmedTag,
    payment_method: payment_method || null,
    payment_source: payment_source || null,
    date,
    note: note || null,
    deduct_from_balance: normalizeDeductFlag(kind, deduct_from_balance),
  };
}

export async function createTransaction(data) {
  const trimmedTag = await validateTransactionFields(data);
  const record = await transactionRecord(data, trimmedTag);
  const id = await db.transactions.add({ ...record, created_at: nowIso() });
  return attachTypeKind(await db.transactions.get(id));
}

export async function updateTransaction(id, data) {
  const trimmedTag = await validateTransactionFields(data);

  const txId = Number(id);
  const existing = await db.transactions.get(txId);
  if (!existing) throw new Error("Transaction not found");

  await db.transactions.update(txId, await transactionRecord(data, trimmedTag));
  return attachTypeKind(await db.transactions.get(txId));
}

export async function deleteTransaction(id) {
  const txId = Number(id);
  const existing = await db.transactions.get(txId);
  if (!existing) throw new Error("Transaction not found");
  await db.transactions.delete(txId);
  return null;
}

export function fetchCreditCards() {
  return db.credit_cards.orderBy("created_at").toArray();
}

// Only card+month combinations with at least one transaction are included,
// matching the old INNER JOIN (a card with no transactions in a given month
// simply doesn't appear, rather than showing a zero).
export async function fetchCardUtilization() {
  const [txs, cards] = await Promise.all([db.credit_card_transactions.toArray(), db.credit_cards.toArray()]);
  const cardNameById = Object.fromEntries(cards.map((c) => [c.id, c.name]));

  const totals = new Map();
  txs.forEach((t) => {
    const month = t.date.slice(0, 7);
    const key = `${t.card_id}:${month}`;
    totals.set(key, (totals.get(key) || 0) + Number(t.amount));
  });

  const rows = [...totals.entries()].map(([key, total]) => {
    const [cardIdStr, month] = key.split(":");
    const card_id = Number(cardIdStr);
    return { card_id, card_name: cardNameById[card_id], month, total };
  });
  rows.sort((a, b) => a.month.localeCompare(b.month));
  return rows;
}

export async function createCreditCard(data) {
  const name = requireNonEmpty(data.name, "name");
  requireValidLast4(data.last4);
  const id = await db.credit_cards.add({ name, last4: data.last4 || null, created_at: nowIso() });
  return db.credit_cards.get(id);
}

// Cascade-deletes the card's transactions too, since IndexedDB has no
// FK/ON DELETE CASCADE support — replaces that behavior from schema.sql.
export async function deleteCreditCard(id) {
  const cardId = Number(id);
  const existing = await db.credit_cards.get(cardId);
  if (!existing) throw new Error("Credit card not found");
  await db.transaction("rw", db.credit_cards, db.credit_card_transactions, async () => {
    await db.credit_card_transactions.where("card_id").equals(cardId).delete();
    await db.credit_cards.delete(cardId);
  });
  return null;
}

export async function fetchCardTransactions(cardId, { months = [] } = {}) {
  let rows = await db.credit_card_transactions.where("card_id").equals(Number(cardId)).toArray();
  if (months.length) rows = rows.filter((t) => months.includes(t.date.slice(0, 7)));
  return sortByDateDesc(rows);
}

export async function createCardTransaction(cardId, data) {
  const id = Number(cardId);
  const card = await db.credit_cards.get(id);
  if (!card) throw new Error("Credit card not found");
  requirePositiveAmount(data.amount);
  const description = requireNonEmpty(data.description, "description");
  if (!data.date) throw new Error("date is required");

  const txId = await db.credit_card_transactions.add({
    card_id: id,
    amount: Number(data.amount),
    description,
    date: data.date,
    created_at: nowIso(),
  });
  return db.credit_card_transactions.get(txId);
}

export async function deleteCardTransaction(cardId, txId) {
  const row = await db.credit_card_transactions.get(Number(txId));
  if (!row || row.card_id !== Number(cardId)) throw new Error("Transaction not found");
  await db.credit_card_transactions.delete(Number(txId));
  return null;
}
