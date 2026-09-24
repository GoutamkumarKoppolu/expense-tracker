import { currency } from "../../utils/format";

// Timeline of money in (Saving transactions from the Tracker) and money out
// (withdrawals). Deposits are edited on the Tracker page; withdrawals here.
export default function SavingsHistory({ entries, onDeleteWithdrawal }) {
  if (!entries.length) {
    return <p className="empty-state">No savings history for this selection.</p>;
  }

  return (
    <table className="transaction-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Pot</th>
          <th>Entry</th>
          <th>Note</th>
          <th className="amount-col">Amount</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {entries.map((e) => {
          const isDeposit = e.entry === "deposit";
          return (
            <tr key={e.key} className={isDeposit ? "row-saving" : "row-expense"}>
              <td>{e.date}</td>
              <td>{e.tag}</td>
              <td>
                {isDeposit ? "Saved" : "Used"}
                {isDeposit && (
                  <span className={`deduct-badge ${e.deducted ? "" : "deduct-badge-off"}`}>
                    {e.deducted ? "from balance" : "not from balance"}
                  </span>
                )}
              </td>
              <td>{e.note || "—"}</td>
              <td className="amount-col">
                {isDeposit ? "+" : "-"}
                {currency(e.amount)}
              </td>
              <td className="row-actions">
                {!isDeposit && (
                  <button className="link-btn danger" onClick={() => onDeleteWithdrawal(e.id)}>
                    Delete
                  </button>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
