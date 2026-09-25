import Money from "../../components/ui/Money";
import { currency } from "../../utils/format";
import { isOver, usedShare } from "./domain";

// Headline card for one event: what's left of the total, how much is used,
// and how the total is split across sub-budgets.
export default function BudgetSummary({ event }) {
  const over = isOver(event.remaining);
  const share = usedShare(event.spent, event.amount);
  const overAllocated = isOver(event.unallocated);

  return (
    <div className="card savings-summary">
      <span className="muted">{over ? "Over budget by" : "Left to spend"}</span>
      <div className="savings-summary-amount">
        <Money value={Math.abs(event.remaining)} className={`big-amount ${over ? "text-negative" : ""}`} />
        <span className="muted">of {currency(event.amount)} budget</span>
      </div>
      <div className="bar-track bar-track-lg">
        <div
          className="bar-fill"
          style={{ width: `${share * 100}%`, background: over ? "var(--negative)" : "var(--accent)" }}
        />
      </div>
      <div className="savings-summary-foot">
        <span>Spent {currency(event.spent)}</span>
        <span>{Math.round(share * 100)}% used</span>
      </div>
      {event.subs.length > 0 && (
        <div className="mini-stats">
          <div>
            <span className="muted">In sub-budgets</span>
            <strong>{currency(event.allocated)}</strong>
          </div>
          <div>
            <span className="muted">{overAllocated ? "Over-allocated by" : "Unallocated"}</span>
            <strong className={overAllocated ? "text-warning" : ""}>{currency(Math.abs(event.unallocated))}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
