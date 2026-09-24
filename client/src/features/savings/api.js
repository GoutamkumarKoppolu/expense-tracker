// Savings data access. Deposits come from the main ledger (transactions of
// kind "saving"); withdrawals live in their own store.
import { db } from "../../db";
import { fetchTransactions } from "../../api";
import { requireNonEmpty, requirePositiveAmount } from "../../db/validators";
import { currency } from "../../utils/format";
import { computePots } from "./domain";

const nowIso = () => new Date().toISOString();

export async function fetchSavingsData() {
  const [savings, withdrawals] = await Promise.all([
    fetchTransactions({ kind: "saving" }),
    db.savings_withdrawals.toArray(),
  ]);
  return { savings, withdrawals };
}

export async function createWithdrawal(data) {
  requirePositiveAmount(data.amount);
  const tag = requireNonEmpty(data.tag, "pot");
  if (!data.date) throw new Error("date is required");

  const { savings, withdrawals } = await fetchSavingsData();
  const pot = computePots(savings, withdrawals).find((p) => p.tag === tag);
  if (!pot) throw new Error(`No savings found for "${tag}"`);
  // Compare in paise so float noise (e.g. 0.1 + 0.2) never blocks using the full pot.
  if (Math.round(Number(data.amount) * 100) > Math.round(pot.remaining * 100)) {
    throw new Error(`Only ${currency(pot.remaining)} left in "${tag}"`);
  }

  const id = await db.savings_withdrawals.add({
    tag,
    amount: Number(data.amount),
    date: data.date,
    note: data.note?.trim() || null,
    created_at: nowIso(),
  });
  return db.savings_withdrawals.get(id);
}

export async function deleteWithdrawal(id) {
  const wId = Number(id);
  if (!(await db.savings_withdrawals.get(wId))) throw new Error("Withdrawal not found");
  await db.savings_withdrawals.delete(wId);
  return null;
}

// Transaction guard (registered in ./index.js): blocks editing or deleting a
// Saving transaction when money already used from its pot would then exceed
// what's saved in it.
export async function guardSavingsPots(before, after) {
  if (before.type_kind !== "saving") return;
  const { savings, withdrawals } = await fetchSavingsData();
  const nextSavings = savings.filter((t) => t.id !== before.id);
  if (after && after.type_kind === "saving") nextSavings.push(after);

  const pot = computePots(nextSavings, withdrawals).find((p) => p.tag === before.tag);
  if (pot && Math.round(pot.remaining * 100) < 0) {
    throw new Error(
      `${currency(pot.used)} has been used from "${before.tag}". Delete those entries on the Savings page first.`
    );
  }
}
