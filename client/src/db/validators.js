// Validation moved client-side from server/routes/transactions.js and
// server/routes/creditCards.js — same rules, same error text, so the
// existing setError(e.message) UI across the app needs no changes.

export async function isKnownOption(db, table, value) {
  if (!value) return true;
  const count = await db[table].where("name").equals(value).count();
  return count > 0;
}

export function requirePositiveAmount(amount) {
  if (!(Number(amount) > 0)) {
    throw new Error("amount must be a positive number");
  }
}

export function requireNonEmpty(value, fieldName) {
  if (!value || !String(value).trim()) {
    throw new Error(`${fieldName} is required`);
  }
  return String(value).trim();
}

export function requireValidLast4(last4) {
  if (last4 && !/^\d{4}$/.test(String(last4))) {
    throw new Error("last4 must be exactly 4 digits");
  }
}
