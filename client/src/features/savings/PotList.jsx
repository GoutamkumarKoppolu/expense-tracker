import { PiggyBank } from "lucide-react";
import EmptyState from "../../components/ui/EmptyState";
import ProgressRing from "../../components/ui/ProgressRing";
import { currency } from "../../utils/format";

// One card per savings pot (tag). Tapping a pot filters the history to it.
export default function PotList({ pots, selectedTag, onSelect }) {
  if (!pots.length) {
    return <EmptyState icon={PiggyBank}>No savings yet. Add a Saving transaction with the + button.</EmptyState>;
  }

  return (
    <div className="pot-list">
      {pots.map((p) => {
        const left = p.saved ? p.remaining / p.saved : 0;
        const active = selectedTag === p.tag;
        return (
          <button
            type="button"
            key={p.tag}
            aria-pressed={active}
            className={`card pot-card ${active ? "is-active" : ""}`}
            onClick={() => onSelect(active ? "" : p.tag)}
          >
            <span className="icon-badge tone-savings">
              <PiggyBank size={18} />
            </span>
            <span className="pot-text">
              <span className="pot-title">{p.tag}</span>
              <span className="pot-sub">
                <strong>{currency(p.remaining)}</strong> left of {currency(p.saved)}
              </span>
            </span>
            <ProgressRing
              value={left}
              color={p.remaining < 0 ? "var(--negative)" : "var(--savings)"}
              label={`${Math.round(left * 100)}%`}
            />
          </button>
        );
      })}
    </div>
  );
}
