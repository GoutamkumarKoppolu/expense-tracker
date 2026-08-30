const currency = (n) => `₹${Number(n).toFixed(2)}`;

export default function SummaryPanel({ transactions, overallSavings }) {
  const totalEarnings = transactions
    .filter((t) => t.type_kind === "earning")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = transactions
    .filter((t) => t.type_kind === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalSavings = transactions
    .filter((t) => t.type_kind === "saving")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const byTag = {};
  transactions
    .filter((t) => t.type_kind === "expense")
    .forEach((t) => {
      byTag[t.tag] = (byTag[t.tag] || 0) + Number(t.amount);
    });

  const tagRows = Object.entries(byTag).sort((a, b) => b[1] - a[1]);

  return (
    <div className="summary-panel">
      <div className="stat-row">
        <div className="stat-card">
          <span className="stat-label">Total Earnings</span>
          <span className="stat-value positive">{currency(totalEarnings)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Total Expenses</span>
          <span className="stat-value negative">{currency(totalExpenses)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Saved (this selection)</span>
          <span className="stat-value savings">{currency(totalSavings)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Overall Savings</span>
          <span className="stat-value savings">{currency(overallSavings)}</span>
        </div>
      </div>

      <h3>Spending by tag</h3>
      {tagRows.length === 0 ? (
        <p className="empty-state">No expenses recorded for this selection.</p>
      ) : (
        <table className="summary-table">
          <thead>
            <tr>
              <th>Tag</th>
              <th className="amount-col">Spent</th>
              <th className="amount-col">% of expenses</th>
            </tr>
          </thead>
          <tbody>
            {tagRows.map(([tag, amount]) => (
              <tr key={tag}>
                <td>{tag}</td>
                <td className="amount-col">{currency(amount)}</td>
                <td className="amount-col">
                  {totalExpenses ? ((amount / totalExpenses) * 100).toFixed(1) : "0.0"}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
