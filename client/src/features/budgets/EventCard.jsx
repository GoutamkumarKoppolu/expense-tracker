import { ChevronRight, Wallet } from "lucide-react";
import { currency } from "../../utils/format";
import { isOver, usedShare } from "./domain";

// One event in the Budgets list: what's left, how much of it is used.
export default function EventCard({ event, onOpen }) {
  const over = isOver(event.remaining);
  const share = usedShare(event.spent, event.amount);

  return (
    <button type="button" className="card budget-card" onClick={() => onOpen(event.id)}>
      <span className="budget-card-head">
        <span className={`icon-badge ${event.done ? "tone-positive" : "tone-accent"}`}>
          <Wallet size={18} />
        </span>
        <span className="budget-card-text">
          <span className="budget-card-title">{event.name}</span>
          <span className="budget-card-sub">
            {currency(event.spent)} spent of {currency(event.amount)}
            {event.subs.length > 0 && ` · ${event.subs.length} sub‑budget${event.subs.length === 1 ? "" : "s"}`}
          </span>
        </span>
        <ChevronRight size={18} className="list-row-chevron" />
      </span>
      <span className="bar-track">
        <span
          className="bar-fill"
          style={{ width: `${share * 100}%`, background: over ? "var(--negative)" : "var(--accent)" }}
        />
      </span>
      <span className="budget-card-foot">
        <span className={over ? "text-negative" : ""}>
          <strong>{currency(Math.abs(event.remaining))}</strong> {over ? "over budget" : "left"}
        </span>
        <span className="muted">{Math.round(share * 100)}% used</span>
      </span>
    </button>
  );
}
