import { compactCurrency, currency } from "../../utils/format";

// tone: "positive" | "negative" | "savings" | "accent" | "warning"
export default function StatCard({ icon: Icon, label, value, tone = "accent", hint }) {
  return (
    <div className="stat-card">
      {Icon && (
        <span className={`icon-badge tone-${tone}`}>
          <Icon size={18} />
        </span>
      )}
      <span className="stat-label">{label}</span>
      <span className="stat-value" title={currency(value)}>
        {compactCurrency(value)}
      </span>
      {hint && <span className="stat-hint">{hint}</span>}
    </div>
  );
}
