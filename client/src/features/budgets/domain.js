// Pure budget rules. An event (parent_id null) has a total budget and can
// optionally be split into sub-budgets (one level). A spend belongs to the
// event directly or to one sub-budget; either way it reduces the event's
// total. Remaining amounts may go negative. Nothing here touches the ledger.

// Sums in paise so float noise (0.1 + 0.2) never shows up as ₹0.30000000004.
const toPaise = (n) => Math.round(Number(n) * 100);
const fromPaise = (p) => p / 100;

export const isEvent = (budget) => budget.parent_id == null;

// Negative, ignoring float noise below one paisa.
export const isOver = (remaining) => toPaise(remaining) < 0;

// Share of the budget used, 0..1 for the progress bar (1 once overspent).
export const usedShare = (spent, budget) => {
  if (toPaise(budget) <= 0) return toPaise(spent) > 0 ? 1 : 0;
  return Math.min(1, Math.max(0, spent / budget));
};

const newestFirst = (a, b) => String(b.created_at).localeCompare(String(a.created_at));
const oldestFirst = (a, b) => -newestFirst(a, b);

function spentByBudget(spends) {
  const map = new Map();
  spends.forEach((s) => map.set(s.budget_id, (map.get(s.budget_id) || 0) + toPaise(s.amount)));
  return map;
}

function summarize(event, budgets, spentPaise) {
  const subs = budgets
    .filter((b) => b.parent_id === event.id)
    .sort(oldestFirst)
    .map((sub) => {
      const spent = spentPaise.get(sub.id) || 0;
      return { ...sub, spent: fromPaise(spent), remaining: fromPaise(toPaise(sub.amount) - spent) };
    });

  const directPaise = spentPaise.get(event.id) || 0;
  const spentPaiseTotal = subs.reduce((sum, s) => sum + toPaise(s.spent), directPaise);
  const allocatedPaise = subs.reduce((sum, s) => sum + toPaise(s.amount), 0);

  return {
    ...event,
    done: Boolean(event.done),
    subs,
    directSpent: fromPaise(directPaise),
    spent: fromPaise(spentPaiseTotal),
    remaining: fromPaise(toPaise(event.amount) - spentPaiseTotal),
    allocated: fromPaise(allocatedPaise),
    // Negative when the sub-budgets add up to more than the total.
    unallocated: fromPaise(toPaise(event.amount) - allocatedPaise),
  };
}

// One event with its sub-budgets and roll-up totals, or null if not found.
export function summarizeEvent(eventId, budgets, spends) {
  const event = budgets.find((b) => b.id === eventId && isEvent(b));
  return event ? summarize(event, budgets, spentByBudget(spends)) : null;
}

// Every event, split into active and done, newest first.
export function summarizeEvents(budgets, spends) {
  const spentPaise = spentByBudget(spends);
  const events = budgets
    .filter(isEvent)
    .sort(newestFirst)
    .map((e) => summarize(e, budgets, spentPaise));
  return { active: events.filter((e) => !e.done), done: events.filter((e) => e.done) };
}

// The event's spends (direct and from its sub-budgets), newest first, each
// with the name of the sub-budget it came from (null = the event directly).
// `budgetId` limits it to one sub-budget, or to direct spends when it's the
// event's own id.
export function eventSpends(summary, spends, budgetId = null) {
  const subName = new Map(summary.subs.map((s) => [s.id, s.name]));
  const ids = new Set([summary.id, ...subName.keys()]);
  return spends
    .filter((s) => ids.has(s.budget_id) && (budgetId == null || s.budget_id === budgetId))
    .map((s) => ({ ...s, budgetName: subName.get(s.budget_id) ?? null }))
    .sort((a, b) => b.date.localeCompare(a.date) || newestFirst(a, b));
}

// Ids of the event and all its sub-budgets: what deleting it removes.
export function familyIds(eventId, budgets) {
  return [eventId, ...budgets.filter((b) => b.parent_id === eventId).map((b) => b.id)];
}
