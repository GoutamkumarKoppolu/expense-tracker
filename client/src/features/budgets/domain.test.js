import { describe, expect, it } from "vitest";
import { eventSpends, familyIds, isOver, summarizeEvent, summarizeEvents, usedShare } from "./domain";

// The car example: ₹10L total, split 5L / 3L / 1L, ₹1L unallocated.
const budgets = [
  { id: 1, parent_id: null, name: "Car", amount: 1000000, done: false, created_at: "2026-09-01T10:00:00.000Z" },
  { id: 2, parent_id: 1, name: "Purchase", amount: 500000, created_at: "2026-09-01T10:01:00.000Z" },
  { id: 3, parent_id: 1, name: "Modifications", amount: 300000, created_at: "2026-09-01T10:02:00.000Z" },
  { id: 4, parent_id: 1, name: "Repair", amount: 100000, created_at: "2026-09-01T10:03:00.000Z" },
  { id: 5, parent_id: null, name: "Wedding", amount: 800000, done: true, created_at: "2026-09-02T10:00:00.000Z" },
];

const spend = (id, budget_id, amount, date = "2026-09-10") => ({
  id,
  budget_id,
  amount,
  description: `spend ${id}`,
  date,
  created_at: `${date}T10:00:00.000Z`,
});

describe("summarizeEvent", () => {
  it("takes a sub-budget spend off both the sub-budget and the total", () => {
    const e = summarizeEvent(1, budgets, [spend(1, 3, 40000)]);
    expect(e.subs.find((s) => s.id === 3)).toMatchObject({ spent: 40000, remaining: 260000 });
    expect(e).toMatchObject({ spent: 40000, remaining: 960000, directSpent: 0 });
  });

  it("counts spends made straight from the whole budget", () => {
    const e = summarizeEvent(1, budgets, [spend(1, 1, 25000), spend(2, 2, 100000)]);
    expect(e).toMatchObject({ directSpent: 25000, spent: 125000, remaining: 875000 });
  });

  it("shows what isn't given to any sub-budget", () => {
    const e = summarizeEvent(1, budgets, []);
    expect(e).toMatchObject({ allocated: 900000, unallocated: 100000 });
  });

  it("goes negative when over-allocated or overspent", () => {
    const over = [...budgets, { id: 6, parent_id: 1, name: "Extras", amount: 200000, created_at: "2026-09-03" }];
    const e = summarizeEvent(1, over, [spend(1, 3, 350000), spend(2, 1, 800000)]);
    expect(e.unallocated).toBe(-100000);
    expect(e.subs.find((s) => s.id === 3).remaining).toBe(-50000);
    expect(e.remaining).toBe(-150000);
    expect(isOver(e.remaining)).toBe(true);
  });

  it("keeps an event without sub-budgets simple", () => {
    const e = summarizeEvent(5, budgets, [spend(1, 5, 1000)]);
    expect(e).toMatchObject({ subs: [], spent: 1000, remaining: 799000, allocated: 0, unallocated: 800000 });
  });

  it("adds money without float noise", () => {
    const e = summarizeEvent(5, budgets, [spend(1, 5, 0.1), spend(2, 5, 0.2)]);
    expect(e.spent).toBe(0.3);
  });

  it("ignores other events' spends and returns null for unknown or sub-budget ids", () => {
    expect(summarizeEvent(1, budgets, [spend(1, 5, 999)]).spent).toBe(0);
    expect(summarizeEvent(99, budgets, [])).toBeNull();
    expect(summarizeEvent(2, budgets, [])).toBeNull();
  });
});

describe("summarizeEvents", () => {
  it("splits active and done events, newest first", () => {
    const extra = { id: 7, parent_id: null, name: "Trip", amount: 5000, created_at: "2026-09-05T00:00:00.000Z" };
    const { active, done } = summarizeEvents([...budgets, extra], []);
    expect(active.map((e) => e.name)).toEqual(["Trip", "Car"]);
    expect(done.map((e) => e.name)).toEqual(["Wedding"]);
  });

  it("treats a missing done flag as not done", () => {
    const { active } = summarizeEvents([{ id: 1, parent_id: null, name: "X", amount: 1, created_at: "a" }], []);
    expect(active).toHaveLength(1);
  });
});

describe("eventSpends", () => {
  const spends = [spend(1, 1, 10, "2026-09-01"), spend(2, 3, 20, "2026-09-03"), spend(3, 5, 30), spend(4, 4, 40, "2026-09-02")];
  const car = summarizeEvent(1, budgets, spends);

  it("lists the event's spends newest first with their sub-budget name", () => {
    const rows = eventSpends(car, spends);
    expect(rows.map((s) => [s.id, s.budgetName])).toEqual([
      [2, "Modifications"],
      [4, "Repair"],
      [1, null],
    ]);
  });

  it("filters to one sub-budget", () => {
    expect(eventSpends(car, spends, 3).map((s) => s.id)).toEqual([2]);
  });
});

describe("helpers", () => {
  it("familyIds returns the event and its sub-budgets", () => {
    expect(familyIds(1, budgets)).toEqual([1, 2, 3, 4]);
    expect(familyIds(5, budgets)).toEqual([5]);
  });

  it("usedShare stays within 0..1", () => {
    expect(usedShare(50, 100)).toBe(0.5);
    expect(usedShare(150, 100)).toBe(1);
    expect(usedShare(0, 0)).toBe(0);
  });

  it("isOver ignores sub-paisa noise", () => {
    expect(isOver(-0.001)).toBe(false);
    expect(isOver(-0.01)).toBe(true);
  });
});
