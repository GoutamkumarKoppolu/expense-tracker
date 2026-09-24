import { ChevronDown } from "lucide-react";
import { TransactionRow, kindMeta } from "../ledger";
import { currency, monthLabel } from "../../utils/format";

function dateRange(first, last) {
  const a = monthLabel(first.slice(0, 7), "short");
  const b = monthLabel(last.slice(0, 7), "short");
  return a === b ? a : `${a} – ${b}`;
}

// One tag: summary header that expands into its transactions by month.
export default function TagCard({ kind, summary, open, onToggle, onOpenTransaction }) {
  const meta = kindMeta(kind);
  const Icon = meta.icon;
  const panelId = `tag-${kind}-${summary.tag}`.replace(/\W+/g, "-");

  return (
    <div className={`card tag-card ${open ? "is-open" : ""}`}>
      <button type="button" className="tag-card-head" aria-expanded={open} aria-controls={panelId} onClick={onToggle}>
        <span className={`icon-badge tone-${meta.tone}`}>
          <Icon size={18} />
        </span>
        <span className="tag-card-text">
          <span className="tag-card-title">{summary.tag}</span>
          <span className="tag-card-sub">
            {summary.count} {summary.count === 1 ? "transaction" : "transactions"} ·{" "}
            {dateRange(summary.firstDate, summary.lastDate)}
          </span>
          {kind === "saving" && (
            <span className="tag-card-pills">
              {summary.fromBalance > 0 && <span className="pill tone-savings">{currency(summary.fromBalance)} from balance</span>}
              {summary.notFromBalance > 0 && (
                <span className="pill tone-accent">{currency(summary.notFromBalance)} not from balance</span>
              )}
            </span>
          )}
        </span>
        <span className={`tag-card-total text-${meta.tone}`}>{currency(summary.total)}</span>
        <ChevronDown size={18} className="tag-card-chevron" aria-hidden="true" />
      </button>

      {open && (
        <div id={panelId} className="tag-card-body">
          {summary.months.map((m) => (
            <section key={m.month}>
              <div className="tx-group-head">
                <span>{monthLabel(m.month)}</span>
                <span className="tx-group-total">{currency(m.total)}</span>
              </div>
              <div className="tag-card-rows">
                {m.rows.map((t) => (
                  <TransactionRow key={t.id} t={t} onSelect={onOpenTransaction} showDate />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
