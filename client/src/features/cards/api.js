// Credit card data access. Cards and their transactions are kept fully
// separate from the main ledger so nothing is double-counted.
import { db } from "../../db";
import { requireNonEmpty, requirePositiveAmount, requireValidLast4 } from "../../db/validators";

const nowIso = () => new Date().toISOString();

// Newest first; ties broken by creation time.
function sortByDateDesc(rows) {
  return [...rows].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return a.created_at < b.created_at ? 1 : -1;
  });
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
