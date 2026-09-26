import { describe, expect, it } from "vitest";
import { cleanPhone, exceeds, maxPayment, summarizeDirection, summarizeRecord, whatsappNumber } from "./domain";

const rec = (id, direction, amount, extra = {}) => ({
  id,
  direction,
  person: `Person ${id}`,
  amount,
  date: `2026-09-${String(id).padStart(2, "0")}`,
  completed: false,
  created_at: `2026-09-${String(id).padStart(2, "0")}T10:00:00.000Z`,
  ...extra,
});
const pay = (id, record_id, amount, date = "2026-09-20") => ({ id, record_id, amount, date, created_at: `${date}T10:00:00.000Z` });

describe("summarizeRecord", () => {
  it("adds up payments and what's left: 50K lent, paid 10K + 10K", () => {
    const r = summarizeRecord(rec(1, "lent", 50000), [pay(1, 1, 10000, "2026-09-10"), pay(2, 1, 10000, "2026-09-15"), pay(3, 2, 999)]);
    expect(r).toMatchObject({ paid: 20000, remaining: 30000, fullyPaid: false, completed: false });
    expect(r.payments.map((p) => p.id)).toEqual([2, 1]);
  });

  it("is completed once fully paid back", () => {
    const r = summarizeRecord(rec(1, "lent", 50000), [pay(1, 1, 10000), pay(2, 1, 10000), pay(3, 1, 30000)]);
    expect(r).toMatchObject({ remaining: 0, fullyPaid: true, completed: true });
  });

  it("can be completed by hand with some left (let go)", () => {
    const r = summarizeRecord(rec(1, "borrowed", 50000, { completed: true }), [pay(1, 1, 48000)]);
    expect(r).toMatchObject({ remaining: 2000, fullyPaid: false, completed: true });
  });

  it("adds without float noise", () => {
    expect(summarizeRecord(rec(1, "lent", 0.3), [pay(1, 1, 0.1), pay(2, 1, 0.2)]).remaining).toBe(0);
  });
});

describe("summarizeDirection", () => {
  const records = [
    rec(1, "borrowed", 50000),
    rec(2, "borrowed", 30000),
    rec(3, "lent", 20000),
    rec(4, "borrowed", 10000, { completed: true }),
  ];
  const payments = [pay(1, 1, 20000), pay(2, 3, 5000)];

  it("keeps each tab to its own records, newest first, and totals the active ones", () => {
    const b = summarizeDirection(records, payments, "borrowed");
    expect(b.active.map((r) => r.id)).toEqual([2, 1]);
    expect(b.completed.map((r) => r.id)).toEqual([4]);
    expect(b.totals).toEqual({ amount: 80000, remaining: 60000 });

    const l = summarizeDirection(records, payments, "lent");
    expect(l.active.map((r) => r.id)).toEqual([3]);
    expect(l.totals.remaining).toBe(15000);
  });
});

describe("payments can't exceed what's left", () => {
  const summary = summarizeRecord(rec(1, "lent", 50000), [pay(1, 1, 40000)]);

  it("allows up to the remaining amount", () => {
    expect(maxPayment(summary)).toBe(10000);
    expect(exceeds(10000, maxPayment(summary))).toBe(false);
    expect(exceeds(10000.01, maxPayment(summary))).toBe(true);
  });

  it("counts the payment's own amount back in when editing it", () => {
    expect(maxPayment(summary, { amount: 40000 })).toBe(50000);
  });
});

describe("phone numbers", () => {
  it("keeps digits and a leading +", () => {
    expect(cleanPhone(" +91 98765-43210 ")).toBe("+919876543210");
    expect(cleanPhone("098765 43210")).toBe("09876543210");
    expect(cleanPhone("abc")).toBe("");
  });

  it("builds WhatsApp numbers, taking 10-digit numbers as Indian", () => {
    expect(whatsappNumber("98765 43210")).toBe("919876543210");
    expect(whatsappNumber("09876543210")).toBe("919876543210");
    expect(whatsappNumber("+1 415 555 0100")).toBe("14155550100");
    expect(whatsappNumber("")).toBe("");
  });
});
