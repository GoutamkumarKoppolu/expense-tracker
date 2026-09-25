// Budget data access. Events, sub-budgets and their spends are kept fully
// separate from the main ledger: nothing here changes the current balance.
import { db } from "../../db";
import { requireNonEmpty, requirePositiveAmount } from "../../db/validators";
import { familyIds, isEvent } from "./domain";

const nowIso = () => new Date().toISOString();

export async function fetchBudgetData() {
  const [budgets, spends] = await Promise.all([db.budgets.toArray(), db.budget_spends.toArray()]);
  return { budgets, spends };
}

async function getEvent(id) {
  const event = await db.budgets.get(Number(id));
  if (!event || !isEvent(event)) throw new Error("Budget not found");
  return event;
}

// Sub-budget names must be unique within their event so spends stay clear.
async function assertUniqueSubName(eventId, name, exceptId = null) {
  const siblings = await db.budgets.where("parent_id").equals(eventId).toArray();
  const clash = siblings.find((b) => b.id !== exceptId && b.name.toLowerCase() === name.toLowerCase());
  if (clash) throw new Error(`"${name}" already exists in this budget`);
}

function budgetFields(data) {
  requirePositiveAmount(data.amount);
  return { name: requireNonEmpty(data.name, "name"), amount: Number(data.amount) };
}

export async function createEvent(data) {
  const id = await db.budgets.add({ ...budgetFields(data), parent_id: null, done: false, created_at: nowIso() });
  return db.budgets.get(id);
}

export async function createSubBudget(eventId, data) {
  const event = await getEvent(eventId);
  const fields = budgetFields(data);
  await assertUniqueSubName(event.id, fields.name);
  const id = await db.budgets.add({ ...fields, parent_id: event.id, created_at: nowIso() });
  return db.budgets.get(id);
}

// Renames or changes the amount of an event or a sub-budget.
export async function updateBudget(id, data) {
  const budget = await db.budgets.get(Number(id));
  if (!budget) throw new Error("Budget not found");
  const fields = budgetFields(data);
  if (!isEvent(budget)) await assertUniqueSubName(budget.parent_id, fields.name, budget.id);
  await db.budgets.update(budget.id, fields);
  return db.budgets.get(budget.id);
}

export async function setEventDone(id, done) {
  const event = await getEvent(id);
  await db.budgets.update(event.id, { done: Boolean(done) });
  return db.budgets.get(event.id);
}

// Deletes an event with all its sub-budgets, or one sub-budget, together
// with their spends. IndexedDB has no cascades, so it's done here in one
// transaction.
export async function deleteBudget(id) {
  const budget = await db.budgets.get(Number(id));
  if (!budget) throw new Error("Budget not found");
  await db.transaction("rw", db.budgets, db.budget_spends, async () => {
    const ids = isEvent(budget) ? familyIds(budget.id, await db.budgets.toArray()) : [budget.id];
    await db.budget_spends.where("budget_id").anyOf(ids).delete();
    await db.budgets.bulkDelete(ids);
  });
  return null;
}

function spendFields(data) {
  requirePositiveAmount(data.amount);
  if (!data.date) throw new Error("date is required");
  return {
    budget_id: Number(data.budget_id),
    amount: Number(data.amount),
    description: requireNonEmpty(data.description, "description"),
    date: data.date,
  };
}

// A spend may only point at the event itself or one of its sub-budgets.
async function assertInEvent(eventId, budgetId) {
  const budget = await db.budgets.get(budgetId);
  if (!budget || (budget.id !== eventId && budget.parent_id !== eventId)) throw new Error("Pick a budget for this spend");
}

export async function createSpend(eventId, data) {
  const event = await getEvent(eventId);
  const fields = spendFields(data);
  await assertInEvent(event.id, fields.budget_id);
  const id = await db.budget_spends.add({ ...fields, created_at: nowIso() });
  return db.budget_spends.get(id);
}

export async function updateSpend(eventId, spendId, data) {
  const event = await getEvent(eventId);
  const existing = await db.budget_spends.get(Number(spendId));
  if (!existing) throw new Error("Spend not found");
  const fields = spendFields(data);
  await assertInEvent(event.id, existing.budget_id);
  await assertInEvent(event.id, fields.budget_id);
  await db.budget_spends.update(existing.id, fields);
  return db.budget_spends.get(existing.id);
}

export async function deleteSpend(spendId) {
  const id = Number(spendId);
  if (!(await db.budget_spends.get(id))) throw new Error("Spend not found");
  await db.budget_spends.delete(id);
  return null;
}
