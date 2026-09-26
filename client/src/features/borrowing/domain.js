// Pure rules for money borrowed from people and lent to people. Each record
// is one borrowing or lending; payments pay it back. Nothing here touches the
// main balance.

// Sums in paise so float noise never shows up in totals.
const toPaise = (n) => Math.round(Number(n) * 100);
const fromPaise = (p) => p / 100;

// Words that differ between the two tabs, in one place.
export const DIRECTIONS = {
  borrowed: {
    tab: "Borrowed",
    add: "Add borrowed money",
    payment: "Repaid",
    addPayment: "Add repayment",
    personLabel: "Borrowed from",
    outstanding: "You still owe",
    empty: "Nothing borrowed yet. Add money you borrowed from someone, then note each repayment.",
  },
  lent: {
    tab: "Lent",
    add: "Add money lent",
    payment: "Received",
    addPayment: "Add money received",
    personLabel: "Lent to",
    outstanding: "Still owed to you",
    empty: "Nothing lent yet. Add money you gave someone, then note each amount they pay back.",
  },
};

export const isDirection = (d) => Object.keys(DIRECTIONS).includes(d);

const newestFirst = (a, b) => b.date.localeCompare(a.date) || String(b.created_at).localeCompare(String(a.created_at));

// One record with its payments (newest first), paid, remaining and whether
// it's completed: fully paid back, or marked completed by hand.
export function summarizeRecord(record, payments) {
  const own = payments.filter((p) => p.record_id === record.id).sort(newestFirst);
  const paidPaise = own.reduce((sum, p) => sum + toPaise(p.amount), 0);
  const remainingPaise = Math.max(0, toPaise(record.amount) - paidPaise);
  return {
    ...record,
    payments: own,
    paid: fromPaise(paidPaise),
    remaining: fromPaise(remainingPaise),
    fullyPaid: remainingPaise === 0,
    completed: remainingPaise === 0 || Boolean(record.completed),
  };
}

// One tab's records split into active and completed (newest first), with
// totals over the active ones.
export function summarizeDirection(records, payments, direction) {
  const all = records
    .filter((r) => r.direction === direction)
    .map((r) => summarizeRecord(r, payments))
    .sort(newestFirst);
  const active = all.filter((r) => !r.completed);
  const totals = active.reduce(
    (t, r) => ({ amount: t.amount + toPaise(r.amount), remaining: t.remaining + toPaise(r.remaining) }),
    { amount: 0, remaining: 0 }
  );
  return {
    active,
    completed: all.filter((r) => r.completed),
    totals: { amount: fromPaise(totals.amount), remaining: fromPaise(totals.remaining) },
  };
}

// How much a payment may be at most: what's left, plus the payment's own
// amount when editing it.
export function maxPayment(summary, editingPayment = null) {
  return fromPaise(toPaise(summary.remaining) + (editingPayment ? toPaise(editingPayment.amount) : 0));
}

export const exceeds = (amount, max) => toPaise(amount) > toPaise(max);

// ---------- phone ----------

// Keeps a leading + and the digits: "+91 98765-43210" → "+919876543210".
export function cleanPhone(phone) {
  const s = String(phone || "").trim();
  const digits = s.replace(/\D/g, "");
  return digits ? (s.startsWith("+") ? `+${digits}` : digits) : "";
}

// Number for wa.me links: country code + number, no "+". A plain 10-digit
// number (or 0 + 10 digits) is taken as Indian and gets 91 in front.
export function whatsappNumber(phone) {
  const clean = cleanPhone(phone);
  if (!clean) return "";
  if (clean.startsWith("+")) return clean.slice(1);
  const digits = clean.replace(/^0(?=\d{10}$)/, "");
  return digits.length === 10 ? `91${digits}` : digits;
}
