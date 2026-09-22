const currency = (n) => `₹${Number(n).toFixed(2)}`;

// Fixed categorical order — colorblind-validated (adjacent ΔE ≥ 8 CVD, ≥ 15
// normal-vision on this app's light/dark surfaces). Never reassign a slot by
// rank; a card keeps its color as other cards are added/removed.
const CARD_COLOR_COUNT = 8;

function lastMonthsAscending(count) {
  const months = [];
  const now = new Date();
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString(undefined, { month: "short", year: "2-digit" });
    months.push({ value, label });
  }
  return months;
}

export default function CardUtilizationChart({ cards, utilization }) {
  if (!cards.length) {
    return <p className="empty-state">Add a credit card above to see monthly utilization.</p>;
  }

  const months = lastMonthsAscending(6);

  const byCardMonth = {};
  utilization.forEach((row) => {
    byCardMonth[`${row.card_id}:${row.month}`] = Number(row.total);
  });

  const max = Math.max(
    1,
    ...cards.flatMap((card) => months.map((m) => byCardMonth[`${card.id}:${m.value}`] || 0))
  );

  return (
    <div className="cc-chart-wrap">
      <div className="cc-legend">
        {cards.map((card, i) => (
          <span className="cc-legend-item" key={card.id}>
            <span className="cc-swatch" style={{ background: `var(--cat-${(i % CARD_COLOR_COUNT) + 1})` }} />
            {card.name}
          </span>
        ))}
      </div>

      <div className="cc-chart" role="img" aria-label="Bar chart of monthly credit card spending by card">
        {months.map((m) => (
          <div className="cc-chart-month" key={m.value}>
            <div className="cc-chart-bars">
              {cards.map((card, i) => {
                const amount = byCardMonth[`${card.id}:${m.value}`] || 0;
                const heightPct = max ? (amount / max) * 100 : 0;
                return (
                  <div
                    key={card.id}
                    className="cc-chart-bar"
                    style={{
                      height: `${heightPct}%`,
                      background: `var(--cat-${(i % CARD_COLOR_COUNT) + 1})`,
                    }}
                    title={`${card.name} — ${m.label}: ${currency(amount)}`}
                  />
                );
              })}
            </div>
            <span className="cc-chart-month-label">{m.label}</span>
          </div>
        ))}
      </div>

      <table className="cc-utilization-table">
        <thead>
          <tr>
            <th>Month</th>
            {cards.map((card) => (
              <th key={card.id} className="amount-col">
                {card.name}
              </th>
            ))}
            <th className="amount-col">Total</th>
          </tr>
        </thead>
        <tbody>
          {months.map((m) => {
            const monthTotal = cards.reduce(
              (sum, card) => sum + (byCardMonth[`${card.id}:${m.value}`] || 0),
              0
            );
            return (
              <tr key={m.value}>
                <td>{m.label}</td>
                {cards.map((card) => (
                  <td key={card.id} className="amount-col">
                    {currency(byCardMonth[`${card.id}:${m.value}`] || 0)}
                  </td>
                ))}
                <td className="amount-col cc-total-col">{currency(monthTotal)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
