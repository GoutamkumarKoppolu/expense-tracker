// Data access for money borrowed from and lent to people. Kept fully separate
// from the main ledger: nothing here changes the current balance.
import { db } from "../../db";
import { requireNonEmpty, requirePositiveAmount } from "../../db/validators";
import { currency } from "../../utils/format";
import { cleanPhone, exceeds, isDirection, maxPayment, summarizeRecord } from "./domain";

const nowIso = () => new Date().toISOString();

export async function fetchBorrowingData() {
  const [records, payments] = await Promise.all([db.borrow_records.toArray(), db.borrow_payments.toArray()]);
  return { records, payments };
}

async function getRecord(id) {
  const record = await db.borrow_records.get(Number(id));
  if (!record) throw new Error("Record not found");
  return record;
}

async function summaryOf(record) {
  return summarizeRecord(record, await db.borrow_payments.where("record_id").equals(record.id).toArray());
}

function recordFields(data) {
  requirePositiveAmount(data.amount);
  if (!data.date) throw new Error("date is required");
  return {
    person: requireNonEmpty(data.person, "name"),
    amount: Number(data.amount),
    date: data.date,
    phone: cleanPhone(data.phone) || null,
    note: data.note?.trim() || null,
  };
}

export async function createRecord(direction, data) {
  if (!isDirection(direction)) throw new Error("Pick borrowed or lent");
  const id = await db.borrow_records.add({ direction, ...recordFields(data), completed: false, created_at: nowIso() });
  return db.borrow_records.get(id);
}

export async function updateRecord(id, data) {
  const record = await getRecord(id);
  const fields = recordFields(data);
  const { paid } = await summaryOf(record);
  if (exceeds(paid, fields.amount)) {
    throw new Error(`${currency(paid)} has already been paid back, so the amount can't be less than that`);
  }
  await db.borrow_records.update(record.id, fields);
  return db.borrow_records.get(record.id);
}

// Marks a record completed by hand (e.g. the rest was let go), or reopens it.
export async function setCompleted(id, completed) {
  const record = await getRecord(id);
  await db.borrow_records.update(record.id, { completed: Boolean(completed) });
  return db.borrow_records.get(record.id);
}

export async function deleteRecord(id) {
  const record = await getRecord(id);
  await db.transaction("rw", db.borrow_records, db.borrow_payments, async () => {
    await db.borrow_payments.where("record_id").equals(record.id).delete();
    await db.borrow_records.delete(record.id);
  });
  return null;
}

function paymentFields(data) {
  requirePositiveAmount(data.amount);
  if (!data.date) throw new Error("date is required");
  return { amount: Number(data.amount), date: data.date, note: data.note?.trim() || null };
}

// A payment can't be more than what's left.
function assertFits(summary, amount, editing = null) {
  const max = maxPayment(summary, editing);
  if (exceeds(amount, max)) throw new Error(`Only ${currency(max)} is left`);
}

export async function createPayment(recordId, data) {
  const record = await getRecord(recordId);
  const fields = paymentFields(data);
  assertFits(await summaryOf(record), fields.amount);
  const id = await db.borrow_payments.add({ record_id: record.id, ...fields, created_at: nowIso() });
  return db.borrow_payments.get(id);
}

export async function updatePayment(paymentId, data) {
  const payment = await db.borrow_payments.get(Number(paymentId));
  if (!payment) throw new Error("Payment not found");
  const fields = paymentFields(data);
  assertFits(await summaryOf(await getRecord(payment.record_id)), fields.amount, payment);
  await db.borrow_payments.update(payment.id, fields);
  return db.borrow_payments.get(payment.id);
}

export async function deletePayment(paymentId) {
  const id = Number(paymentId);
  if (!(await db.borrow_payments.get(id))) throw new Error("Payment not found");
  await db.borrow_payments.delete(id);
  return null;
}
