// Pure savings rules: pots are savings grouped by tag, reduced by
// withdrawals. Withdrawals only reduce savings, never the current balance.
import { deductsFromBalance } from "../../domain/transactions";

// savings: ledger rows of kind "saving"; withdrawals: savings_withdrawals rows.
export function computePots(savings, withdrawals) {
  const pots = new Map();
  const pot = (tag) => {
    if (!pots.has(tag)) pots.set(tag, { tag, saved: 0, fromBalance: 0, notFromBalance: 0, used: 0 });
    return pots.get(tag);
  };

  savings.forEach((t) => {
    const p = pot(t.tag);
    const amount = Number(t.amount);
    p.saved += amount;
    if (deductsFromBalance(t)) p.fromBalance += amount;
    else p.notFromBalance += amount;
  });
  withdrawals.forEach((w) => {
    pot(w.tag).used += Number(w.amount);
  });

  return [...pots.values()]
    .map((p) => ({ ...p, remaining: p.saved - p.used }))
    .sort((a, b) => b.remaining - a.remaining || a.tag.localeCompare(b.tag));
}

export function summarizePots(pots) {
  return pots.reduce(
    (acc, p) => ({
      saved: acc.saved + p.saved,
      fromBalance: acc.fromBalance + p.fromBalance,
      notFromBalance: acc.notFromBalance + p.notFromBalance,
      used: acc.used + p.used,
      remaining: acc.remaining + p.remaining,
    }),
    { saved: 0, fromBalance: 0, notFromBalance: 0, used: 0, remaining: 0 }
  );
}

// Deposits and withdrawals merged into one newest-first timeline, optionally
// limited to one pot (tag).
export function buildHistory(savings, withdrawals, tag = "") {
  const entries = [
    ...savings.map((t) => ({
      key: `deposit-${t.id}`,
      id: t.id,
      entry: "deposit",
      tag: t.tag,
      amount: Number(t.amount),
      date: t.date,
      note: t.note,
      deducted: deductsFromBalance(t),
      created_at: t.created_at,
    })),
    ...withdrawals.map((w) => ({
      key: `withdrawal-${w.id}`,
      id: w.id,
      entry: "withdrawal",
      tag: w.tag,
      amount: Number(w.amount),
      date: w.date,
      note: w.note,
      created_at: w.created_at,
    })),
  ];
  return entries
    .filter((e) => !tag || e.tag === tag)
    .sort((a, b) => b.date.localeCompare(a.date) || String(b.created_at).localeCompare(String(a.created_at)));
}
