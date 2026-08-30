const currency = (n) => `₹${Number(n).toFixed(2)}`;

export default function TransactionList({ transactions, onEdit, onDelete }) {
  if (!transactions.length) {
    return <p className="empty-state">No transactions for this selection yet.</p>;
  }

  return (
    <table className="transaction-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Type</th>
          <th>Tag</th>
          <th>Payment Method</th>
          <th>Payment Source</th>
          <th>Note</th>
          <th className="amount-col">Amount</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {transactions.map((t) => (
          <tr key={t.id} className={`row-${t.type_kind || "expense"}`}>
            <td>{t.date.slice(0, 10)}</td>
            <td>{t.type}</td>
            <td>{t.tag}</td>
            <td>{t.payment_method || "—"}</td>
            <td>{t.payment_source || "—"}</td>
            <td>{t.note || "—"}</td>
            <td className="amount-col">
              {t.type_kind === "earning" ? "+" : "-"}
              {currency(t.amount)}
            </td>
            <td className="row-actions">
              <button className="link-btn" onClick={() => onEdit(t)}>
                Edit
              </button>
              <button className="link-btn danger" onClick={() => onDelete(t.id)}>
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
