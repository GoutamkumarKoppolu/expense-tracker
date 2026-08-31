const currency = (n) => `₹${Number(n).toFixed(2)}`;

export default function SpendingChart({ rows, total }) {
  if (!rows.length) {
    return <p className="empty-state">No expenses recorded for this selection.</p>;
  }

  const max = Math.max(...rows.map(([, amount]) => amount));

  return (
    <div className="spend-chart" role="img" aria-label="Bar chart of spending by tag">
      {rows.map(([tag, amount]) => {
        const widthPct = max ? (amount / max) * 100 : 0;
        const sharePct = total ? (amount / total) * 100 : 0;
        return (
          <div className="spend-chart-row" key={tag}>
            <span className="spend-chart-label" title={tag}>
              {tag}
            </span>
            <div className="spend-chart-track">
              <div
                className="spend-chart-bar"
                style={{ width: `${widthPct}%` }}
                title={`${tag}: ${currency(amount)} (${sharePct.toFixed(1)}% of expenses)`}
              />
            </div>
            <span className="spend-chart-value">{currency(amount)}</span>
          </div>
        );
      })}
    </div>
  );
}
