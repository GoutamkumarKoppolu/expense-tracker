import { Layers } from "lucide-react";
import ProgressRing from "../../components/ui/ProgressRing";
import { currency } from "../../utils/format";
import { isOver, usedShare } from "./domain";

// One card per sub-budget. Tapping one shows only its spends below.
export default function SubBudgetList({ subs, selectedId, onSelect }) {
  return (
    <div className="pot-list">
      {subs.map((s) => {
        const over = isOver(s.remaining);
        const share = usedShare(s.spent, s.amount);
        const active = selectedId === s.id;
        return (
          <button
            type="button"
            key={s.id}
            aria-pressed={active}
            className={`card pot-card budget-sub-card ${active ? "is-active" : ""}`}
            onClick={() => onSelect(active ? null : s.id)}
          >
            <span className={`icon-badge ${over ? "tone-negative" : "tone-accent"}`}>
              <Layers size={18} />
            </span>
            <span className="pot-text">
              <span className="pot-title">{s.name}</span>
              <span className="pot-sub">
                <strong className={over ? "text-negative" : ""}>
                  {over ? `${currency(-s.remaining)} over` : `${currency(s.remaining)} left`}
                </strong>{" "}
                of {currency(s.amount)}
              </span>
            </span>
            <ProgressRing
              value={share}
              color={over ? "var(--negative)" : "var(--accent)"}
              label={`${Math.round(share * 100)}%`}
            />
          </button>
        );
      })}
    </div>
  );
}
