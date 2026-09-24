import { Receipt } from "lucide-react";
import EmptyState from "../../components/ui/EmptyState";
import { deductsFromBalance, isSaving } from "../../domain/transactions";
import { currency, dateHeading, groupByDate } from "../../utils/format";
import { kindMeta } from "./kindMeta";

function signedTotal(rows) {
  return rows.reduce((sum, t) => sum + (t.type_kind === "earning" ? 1 : -1) * Number(t.amount), 0);
}

function TransactionRow({ t, onSelect }) {
  const meta = kindMeta(t.type_kind);
  const Icon = meta.icon;
  const details = [t.type, t.payment_method, t.payment_source, t.note].filter(Boolean).join(" · ");

  return (
    <button type="button" className="tx-row" onClick={() => onSelect(t)}>
      <span className={`icon-badge tone-${meta.tone}`}>
        <Icon size={18} />
      </span>
      <span className="tx-main">
        <span className="tx-title">{t.tag}</span>
        <span className="tx-sub">{details}</span>
        {isSaving(t) && (
          <span className={`pill ${deductsFromBalance(t) ? "tone-savings" : "tone-accent"}`}>
            {deductsFromBalance(t) ? "From balance" : "Not from balance"}
          </span>
        )}
      </span>
      <span className={`tx-amount text-${meta.tone}`}>
        {meta.sign}
        {currency(t.amount)}
      </span>
    </button>
  );
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
