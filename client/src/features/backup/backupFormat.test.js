import { describe, expect, it } from "vitest";
import { BACKUP_APP, BACKUP_FORMAT, parseBackup } from "./backupFormat";

const backupWith = (tables) => JSON.stringify({ app: BACKUP_APP, format: BACKUP_FORMAT, tables });

const event = { id: 1, parent_id: null, name: "Car", amount: 1000000, done: false, created_at: "2026-09-01T10:00:00.000Z" };
const sub = { id: 2, parent_id: 1, name: "Modifications", amount: 300000, created_at: "2026-09-01T10:01:00.000Z" };
const spend = { id: 1, budget_id: 2, amount: 40000, description: "Alloys", date: "2026-09-10", created_at: "2026-09-10T10:00:00.000Z" };

describe("parseBackup: budgets", () => {
  it("imports events, sub-budgets and spends", () => {
    const { tables } = parseBackup(backupWith({ budgets: [event, sub], budget_spends: [spend] }));
    expect(tables.budgets).toEqual([event, { ...sub, done: false }]);
    expect(tables.budget_spends).toEqual([spend]);
  });

  it("starts budgets empty for a backup made before they existed", () => {
    const { tables, summary } = parseBackup(backupWith({ transactions: [] }));
    expect(tables.budgets).toEqual([]);
    expect(tables.budget_spends).toEqual([]);
    expect(summary.missingTables).toEqual(expect.arrayContaining(["budgets", "budget_spends"]));
  });

  it("rejects a sub-budget whose parent is missing", () => {
    expect(() => parseBackup(backupWith({ budgets: [sub] }))).toThrow(/parent 1 isn't a budget/);
  });

  it("rejects sub-budgets nested more than one level", () => {
    const nested = { ...sub, id: 3, parent_id: 2, name: "Alloys" };
    expect(() => parseBackup(backupWith({ budgets: [event, sub, nested] }))).toThrow(/parent 2 isn't a budget/);
  });

  it("rejects a spend pointing at an unknown budget", () => {
    expect(() => parseBackup(backupWith({ budgets: [event], budget_spends: [spend] }))).toThrow(/budget 2 isn't in this backup/);
  });

  it("rejects a budget without a positive amount", () => {
    expect(() => parseBackup(backupWith({ budgets: [{ ...event, amount: 0 }] }))).toThrow(/amount must be a positive number/);
  });
});
