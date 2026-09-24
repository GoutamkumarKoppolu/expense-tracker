import SpendingChart from "./SpendingChart";
import { computeTotals } from "../domain/transactions";
import { currency } from "../utils/format";

export default function SummaryPanel({ transactions, overview }) {
  const {
    earnings: totalEarnings,
    expenses: totalExpenses,
    savings: totalSavings,
  } = computeTotals(transactions);

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
          <span className="stat-value savings">{currency(overview.totalSavings)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Current Balance</span>
          <span className={`stat-value ${overview.balance >= 0 ? "positive" : "negative"}`}>
            {currency(overview.balance)}
          </span>
        </div>
      </div>

      <h3>Spending by tag</h3>
      <SpendingChart rows={tagRows} total={totalExpenses} />
      {tagRows.length > 0 && (
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
