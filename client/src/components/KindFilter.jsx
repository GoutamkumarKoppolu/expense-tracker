import { DEDUCTION_FILTERS, KIND_LABELS, TRANSACTION_KINDS } from "../domain/transactions";

const DEDUCTION_LABELS = {
  [DEDUCTION_FILTERS.ALL]: "All",
  [DEDUCTION_FILTERS.DEDUCTED]: "From balance",
  [DEDUCTION_FILTERS.NOT_DEDUCTED]: "Not from balance",
};

// Single-select transaction-kind filter; the balance-deduction filter only
// applies to savings, so it's shown only when "Saving" is selected.
export default function KindFilter({ kind, deduction, onChange }) {
  return (
    <div className="field-row">
      <label>
        Transaction type
        <select
          value={kind}
          onChange={(e) => onChange({ kind: e.target.value, deduction: DEDUCTION_FILTERS.ALL })}
        >
          <option value="">All types</option>
          {TRANSACTION_KINDS.map((k) => (
            <option key={k} value={k}>
              {KIND_LABELS[k]}
            </option>
          ))}
        </select>
      </label>

      {kind === "saving" && (
        <label>
          Balance deduction
          <select value={deduction} onChange={(e) => onChange({ kind, deduction: e.target.value })}>
            {Object.values(DEDUCTION_FILTERS).map((d) => (
              <option key={d} value={d}>
                {DEDUCTION_LABELS[d]}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
