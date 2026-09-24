import { Receipt } from "lucide-react";
import EmptyState from "../../components/ui/EmptyState";
import { currency, dateHeading, groupByDate } from "../../utils/format";
import TransactionRow from "./TransactionRow";

function signedTotal(rows) {
  return rows.reduce((sum, t) => sum + (t.type_kind === "earning" ? 1 : -1) * Number(t.amount), 0);
}

// Date-grouped transaction cards; tapping one opens it for editing.
export default function TransactionList({ transactions, onSelect }) {
  if (!transactions.length) {
    return <EmptyState icon={Receipt}>No transactions for these filters yet. Tap + to add one.</EmptyState>;
  }

  return (
    <div className="tx-groups">
      {groupByDate(transactions).map((g) => (
        <section key={g.date} className="tx-group">
          <div className="tx-group-head">
            <span>{dateHeading(g.date)}</span>
            <span className="tx-group-total">Net {currency(signedTotal(g.rows))}</span>
          </div>
          <div className="card card-list">
            {g.rows.map((t) => (
              <TransactionRow key={t.id} t={t} onSelect={onSelect} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
