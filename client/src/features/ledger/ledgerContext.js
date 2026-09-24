import { createContext, useContext } from "react";
import { DEDUCTION_FILTERS } from "../../domain/transactions";
import { currentMonth } from "../../utils/format";

export const LedgerContext = createContext(null);

export const defaultFilters = () => ({
  months: [currentMonth()],
  tags: [],
  kind: "",
  deduction: DEDUCTION_FILTERS.ALL,
});

export function useLedger() {
  const ctx = useContext(LedgerContext);
  if (!ctx) throw new Error("useLedger must be used inside <LedgerProvider>");
  return ctx;
}
