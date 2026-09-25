import { Receipt } from "lucide-react";
import EmptyState from "../../components/ui/EmptyState";
import { currency, dateHeading, groupByDate } from "../../utils/format";

// Date-grouped spends of one event. Tap a row to edit or delete it.
export default function SpendList({ spends, onOpen }) {
  if (!spends.length) {
    return <EmptyState icon={Receipt}>No spends here yet. Use “Add spend” to note one down.</EmptyState>;
  }

  return (
    <div className="tx-groups">
      {groupByDate(spends).map((g) => (
        <section key={g.date} className="tx-group">
          <div className="tx-group-head">
            <span>{dateHeading(g.date)}</span>
          </div>
          <div className="card card-list">
            {g.rows.map((s) => (
              <button type="button" className="tx-row" key={s.id} onClick={() => onOpen(s)}>
                <span className="icon-badge tone-negative">
                  <Receipt size={18} />
                </span>
                <span className="tx-main">
                  <span className="tx-title">{s.description}</span>
                  {s.budgetName && <span className="pill tone-accent">{s.budgetName}</span>}
                </span>
                <span className="tx-amount text-negative">−{currency(s.amount)}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
