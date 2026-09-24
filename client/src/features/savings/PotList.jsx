import { currency } from "../../utils/format";

// One row per savings pot (tag). Clicking a pot filters the history to it.
export default function PotList({ pots, selectedTag, onSelect }) {
  if (!pots.length) {
    return <p className="empty-state">No savings yet. Add a Saving transaction on the Tracker page.</p>;
  }

  return (
    <table className="summary-table pot-table">
      <thead>
        <tr>
          <th>Pot (tag)</th>
          <th className="amount-col">Saved</th>
          <th className="amount-col">Used</th>
          <th className="amount-col">Remaining</th>
        </tr>
      </thead>
      <tbody>
        {pots.map((p) => (
          <tr
            key={p.tag}
            className={`pot-row ${selectedTag === p.tag ? "pot-row-active" : ""}`}
            onClick={() => onSelect(selectedTag === p.tag ? "" : p.tag)}
          >
            <td>{p.tag}</td>
            <td className="amount-col">{currency(p.saved)}</td>
            <td className="amount-col">{currency(p.used)}</td>
            <td className={`amount-col ${p.remaining >= 0 ? "positive" : "negative"}`}>{currency(p.remaining)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
