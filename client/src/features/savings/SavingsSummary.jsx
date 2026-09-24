import { currency } from "../../utils/format";

export default function SavingsSummary({ summary }) {
  const stats = [
    { label: "Total saved", value: summary.saved, tone: "savings" },
    { label: "From balance", value: summary.fromBalance, tone: "savings" },
    { label: "Not from balance", value: summary.notFromBalance, tone: "savings" },
    { label: "Used", value: summary.used, tone: "negative" },
    { label: "Remaining", value: summary.remaining, tone: summary.remaining >= 0 ? "positive" : "negative" },
  ];

  return (
    <div className="stat-row">
      {stats.map((s) => (
        <div className="stat-card" key={s.label}>
          <span className="stat-label">{s.label}</span>
          <span className={`stat-value ${s.tone}`}>{currency(s.value)}</span>
        </div>
      ))}
    </div>
  );
}
