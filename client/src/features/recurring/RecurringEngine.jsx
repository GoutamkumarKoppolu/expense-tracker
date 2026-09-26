import { useEffect } from "react";
import { useLedger } from "../ledger";
import { today } from "../../utils/format";
import { runDueRecurring } from "./api";

// Invisible: adds recurring payments as they fall due. Runs when the app
// opens, whenever the ledger changes (e.g. the month's Salary was just
// added) and when the app comes back to the foreground (e.g. the next day).
// Refreshes the ledger only if something was added, so it can't loop.
export default function RecurringEngine() {
  const { transactions, refresh } = useLedger();

  useEffect(() => {
    runDueRecurring(today())
      .then((added) => added && refresh())
      .catch(() => {
        // Shown on the Recurring page, which runs the same check.
      });
  }, [transactions, refresh]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      runDueRecurring(today())
        .then((added) => added && refresh())
        .catch(() => {});
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  return null;
}
