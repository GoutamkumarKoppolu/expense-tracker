// Dexie schema, 1:1 with server/schema.sql. `date` and `created_at` are
// stored as plain strings ("YYYY-MM-DD" / ISO), never Date objects, so the
// existing date.slice(0, 7)-style month-key logic throughout the app keeps
// working unchanged and timezone conversion never enters the picture.
export const STORES = {
  transaction_types: "++id, &name, kind",
  payment_methods: "++id, &name",
  payment_sources: "++id, &name",
  transactions: "++id, type, amount, tag, payment_method, payment_source, date, note, created_at",
  credit_cards: "++id, name, last4, created_at",
  credit_card_transactions: "++id, card_id, amount, description, date, created_at",
};

// Version 2: adds money taken out of savings (see features/savings). Dexie
// keeps every table from earlier versions, so only new/changed stores go here.
export const STORES_V2 = {
  savings_withdrawals: "++id, tag, date, created_at",
};
