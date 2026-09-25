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

describe("parseBackup: bills", () => {
  const folder = { id: 1, name: "Warranties", created_at: "2026-09-01T10:00:00.000Z" };
  const bill = { id: 5, folder_id: 1, name: "Fridge invoice", created_at: "2026-09-02T10:00:00.000Z" };
  const page = {
    id: 9,
    bill_id: 5,
    position: 0,
    name: "invoice.pdf",
    type: "application/pdf",
    size: 3,
    data: { $blob: "JVBE", type: "application/pdf" },
    thumb: null,
    created_at: "2026-09-02T10:00:00.000Z",
  };

  it("imports folders, bills and pages with their file data", () => {
    const { tables } = parseBackup(backupWith({ bill_folders: [folder], bills: [bill], bill_pages: [page] }));
    expect(tables.bill_folders).toEqual([folder]);
    expect(tables.bills).toEqual([bill]);
    expect(tables.bill_pages).toEqual([page]);
  });

  it("keeps a photo's preview", () => {
    const photo = { ...page, type: "image/jpeg", thumb: { $blob: "/9j/", type: "image/jpeg" } };
    const { tables } = parseBackup(backupWith({ bill_folders: [folder], bills: [bill], bill_pages: [photo] }));
    expect(tables.bill_pages[0].thumb).toEqual({ $blob: "/9j/", type: "image/jpeg" });
  });

  it("starts bills empty for a backup made before they existed", () => {
    const { tables } = parseBackup(backupWith({ transactions: [] }));
    expect(tables.bill_folders).toEqual([]);
    expect(tables.bills).toEqual([]);
    expect(tables.bill_pages).toEqual([]);
  });

  it("rejects a page without file data", () => {
    const broken = { ...page, data: null };
    expect(() => parseBackup(backupWith({ bill_folders: [folder], bills: [bill], bill_pages: [broken] }))).toThrow(/page has no file data/);
  });

  it("rejects file data that isn't base64", () => {
    const broken = { ...page, data: { $blob: "not base64!", type: "application/pdf" } };
    expect(() => parseBackup(backupWith({ bill_folders: [folder], bills: [bill], bill_pages: [broken] }))).toThrow(/isn't valid file data/);
  });

  it("rejects bills and pages pointing at missing parents", () => {
    expect(() => parseBackup(backupWith({ bills: [bill] }))).toThrow(/folder 1 isn't in this backup/);
    expect(() => parseBackup(backupWith({ bill_folders: [folder], bill_pages: [page] }))).toThrow(/bill 5 isn't in this backup/);
  });

  it("rejects two folders with the same name", () => {
    const twin = { ...folder, id: 2, name: "warranties" };
    expect(() => parseBackup(backupWith({ bill_folders: [folder, twin] }))).toThrow(/duplicate name/);
  });
});
