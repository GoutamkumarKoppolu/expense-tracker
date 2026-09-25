// Backup file format: build, migrate, validate and normalize. Pure — no
// storage or UI — so it's safe to test on its own.
//
// Keeping old backups importable as the app grows:
//  • Add a NEW TABLE  → add a spec to TABLE_SPECS. Older backups don't have
//    it, so it simply starts empty.
//  • Add a NEW FIELD  → set it in that table's spec with a default for rows
//    that don't have it (see `deduct_from_balance` below).
//  • CHANGE MEANING of existing data → bump BACKUP_FORMAT and add a step to
//    MIGRATIONS that rewrites older backups into the new shape.
// Import validates every row before anything is written, and refuses
// backups from a newer app version instead of guessing.
import { TRANSACTION_KINDS, normalizeDeductFlag } from "../../domain/transactions";

export const BACKUP_APP = "expense-tracker";
export const BACKUP_FORMAT = 1;

// MIGRATIONS[n] upgrades a format-n backup to format n+1.
const MIGRATIONS = {
  // 1: (backup) => ({ ...backup, format: 2, tables: { ...changed } }),
};

// ---------- field helpers (throw Error with a readable message) ----------

const text = (v) => (v === undefined || v === null ? "" : String(v)).trim();

function need(condition, message) {
  if (!condition) throw new Error(message);
}

const required = (v, field) => {
  const s = text(v);
  need(s, `${field} is missing`);
  return s;
};

const optional = (v) => text(v) || null;

const id = (v, field = "id") => {
  const n = Number(v);
  need(Number.isInteger(n) && n > 0, `${field} must be a positive whole number`);
  return n;
};

const amount = (v) => {
  const n = Number(v);
  need(Number.isFinite(n) && n > 0, "amount must be a positive number");
  return n;
};

const date = (v) => {
  const s = text(v).slice(0, 10);
  need(/^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s)), `date "${text(v)}" is not a valid YYYY-MM-DD date`);
  return s;
};

const createdAt = (v, fallbackDate) =>
  typeof v === "string" && !Number.isNaN(Date.parse(v)) ? v : `${fallbackDate || "1970-01-01"}T00:00:00.000Z`;

// ---------- per-table specs, in import order (parents before children) ----------
// Each takes a raw row plus a context of already-normalized tables and
// returns the clean row to store.

const option = (r) => ({ id: id(r.id), name: required(r.name, "name") });

export const TABLE_SPECS = {
  transaction_types: (r) => {
    const kind = text(r.kind);
    need(TRANSACTION_KINDS.includes(kind), `kind must be one of ${TRANSACTION_KINDS.join(", ")}`);
    return { ...option(r), kind };
  },
  payment_methods: option,
  payment_sources: option,
  transactions: (r, ctx) => {
    const type = required(r.type, "type");
    const d = date(r.date);
    return {
      id: id(r.id),
      type,
      amount: amount(r.amount),
      tag: required(r.tag, "tag"),
      payment_method: optional(r.payment_method),
      payment_source: optional(r.payment_source),
      date: d,
      note: optional(r.note),
      // Added after v1 of the app: older rows have no value. Savings then
      // default to "deducted", which is how they always behaved.
      deduct_from_balance: normalizeDeductFlag(ctx.kindByType[type], r.deduct_from_balance),
      created_at: createdAt(r.created_at, d),
    };
  },
  credit_cards: (r) => {
    const last4 = optional(r.last4);
    need(!last4 || /^\d{4}$/.test(last4), "last4 must be exactly 4 digits");
    return { id: id(r.id), name: required(r.name, "name"), last4, created_at: createdAt(r.created_at) };
  },
  credit_card_transactions: (r, ctx) => {
    const cardId = id(r.card_id, "card_id");
    need(ctx.cardIds.has(cardId), `card ${cardId} isn't in this backup`);
    const d = date(r.date);
    return {
      id: id(r.id),
      card_id: cardId,
      amount: amount(r.amount),
      description: required(r.description, "description"),
      date: d,
      created_at: createdAt(r.created_at, d),
    };
  },
  savings_withdrawals: (r) => {
    const d = date(r.date);
    return {
      id: id(r.id),
      tag: required(r.tag, "pot"),
      amount: amount(r.amount),
      date: d,
      note: optional(r.note),
      created_at: createdAt(r.created_at, d),
    };
  },
  // Added in database v3. parent_id null = an event; otherwise a sub-budget of
  // that event (checked once the whole table is read, see checkBudgetParents).
  budgets: (r) => ({
    id: id(r.id),
    parent_id: r.parent_id === undefined || r.parent_id === null ? null : id(r.parent_id, "parent_id"),
    name: required(r.name, "name"),
    amount: amount(r.amount),
    done: r.done === true,
    created_at: createdAt(r.created_at),
  }),
  budget_spends: (r, ctx) => {
    const budgetId = id(r.budget_id, "budget_id");
    need(ctx.budgetIds.has(budgetId), `budget ${budgetId} isn't in this backup`);
    const d = date(r.date);
    return {
      id: id(r.id),
      budget_id: budgetId,
      amount: amount(r.amount),
      description: required(r.description, "description"),
      date: d,
      created_at: createdAt(r.created_at, d),
    };
  },
};

// Tables whose `name` must be unique (they have a unique index).
const UNIQUE_NAME_TABLES = ["transaction_types", "payment_methods", "payment_sources"];

export const TABLE_LABELS = {
  transaction_types: "Transaction types",
  payment_methods: "Payment methods",
  payment_sources: "Payment sources",
  transactions: "Transactions",
  credit_cards: "Credit cards",
  credit_card_transactions: "Card spends",
  savings_withdrawals: "Savings used",
  budgets: "Budgets",
  budget_spends: "Budget spends",
};

// Sub-budgets are one level deep: every parent_id must be an event (a row
// whose own parent_id is null) in the same backup.
function checkBudgetParents(rows) {
  const events = new Set(rows.filter((b) => b.parent_id === null).map((b) => b.id));
  return rows
    .filter((b) => b.parent_id !== null && !events.has(b.parent_id))
    .map((b) => `${TABLE_LABELS.budgets} "${b.name}": its parent ${b.parent_id} isn't a budget in this backup`);
}

// ---------- build ----------

export function buildBackup(tables, preferences = {}, exportedAt = new Date().toISOString()) {
  return { app: BACKUP_APP, format: BACKUP_FORMAT, exportedAt, preferences, tables };
}

// ---------- parse + validate ----------

const MAX_LISTED_PROBLEMS = 5;

// Returns { tables, preferences, summary } or throws an Error whose message
// is safe to show the user. Nothing here touches the database.
export function parseBackup(fileText) {
  let backup;
  try {
    backup = JSON.parse(fileText);
  } catch {
    throw new Error("This file isn't a backup (it's not valid JSON).");
  }
  need(backup && typeof backup === "object" && backup.app === BACKUP_APP, "This file isn't an Expense Tracker backup.");
  need(Number.isInteger(backup.format) && backup.format >= 1, "This backup is missing its format version.");
  need(
    backup.format <= BACKUP_FORMAT,
    "This backup was made by a newer version of the app. Update the app, then import it again."
  );
  need(backup.tables && typeof backup.tables === "object", "This backup has no data in it.");

  const originalFormat = backup.format;
  while (backup.format < BACKUP_FORMAT) {
    const step = MIGRATIONS[backup.format];
    need(step, `Can't upgrade backup format ${backup.format}.`);
    backup = step(backup);
  }

  const problems = [];
  const tables = {};
  const ctx = { kindByType: {}, cardIds: new Set(), budgetIds: new Set() };
  const missingTables = [];

  for (const [name, spec] of Object.entries(TABLE_SPECS)) {
    const raw = backup.tables[name];
    if (raw === undefined) {
      missingTables.push(name);
      tables[name] = [];
      continue;
    }
    if (!Array.isArray(raw)) {
      problems.push(`${TABLE_LABELS[name]}: expected a list`);
      tables[name] = [];
      continue;
    }

    const rows = [];
    const seenIds = new Set();
    const seenNames = new Set();
    raw.forEach((r, i) => {
      const where = `${TABLE_LABELS[name]} row ${i + 1}`;
      try {
        need(r && typeof r === "object", "not a record");
        const row = spec(r, ctx);
        need(!seenIds.has(row.id), `duplicate id ${row.id}`);
        seenIds.add(row.id);
        if (UNIQUE_NAME_TABLES.includes(name)) {
          const key = row.name.toLowerCase();
          need(!seenNames.has(key), `duplicate name "${row.name}"`);
          seenNames.add(key);
        }
        rows.push(row);
      } catch (e) {
        problems.push(`${where}: ${e.message}`);
      }
    });
    tables[name] = rows;

    if (name === "transaction_types") rows.forEach((t) => (ctx.kindByType[t.name] = t.kind));
    if (name === "credit_cards") rows.forEach((c) => ctx.cardIds.add(c.id));
    if (name === "budgets") {
      problems.push(...checkBudgetParents(rows));
      rows.forEach((b) => ctx.budgetIds.add(b.id));
    }
  }

  if (problems.length) {
    const listed = problems.slice(0, MAX_LISTED_PROBLEMS).join("; ");
    const more = problems.length > MAX_LISTED_PROBLEMS ? ` (+${problems.length - MAX_LISTED_PROBLEMS} more)` : "";
    throw new Error(`This backup has ${problems.length} problem${problems.length === 1 ? "" : "s"}, so nothing was imported: ${listed}${more}.`);
  }

  const ignoredTables = Object.keys(backup.tables).filter((n) => !(n in TABLE_SPECS));

  return {
    tables,
    preferences: backup.preferences && typeof backup.preferences === "object" ? backup.preferences : {},
    summary: {
      exportedAt: typeof backup.exportedAt === "string" ? backup.exportedAt : null,
      format: originalFormat,
      counts: Object.fromEntries(Object.entries(tables).map(([n, rows]) => [n, rows.length])),
      missingTables,
      ignoredTables,
    },
  };
}
