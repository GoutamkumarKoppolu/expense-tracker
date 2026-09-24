import Money from "../../components/ui/Money";
import { currency } from "../../utils/format";

// Headline card: what's left overall, with a used-vs-saved progress bar.
export default function SavingsSummary({ summary }) {
  const usedShare = summary.saved ? Math.min(1, summary.used / summary.saved) : 0;

  return (
    <div className="card savings-summary">
      <span className="muted">Available savings</span>
      <div className="savings-summary-amount">
        <Money value={summary.remaining} className="big-amount" />
        <span className="muted">of {currency(summary.saved)} saved</span>
      </div>
      <div className="bar-track bar-track-lg">
        <div className="bar-fill" style={{ width: `${(1 - usedShare) * 100}%`, background: "var(--savings)" }} />
      </div>
      <div className="savings-summary-foot">
        <span>Used {currency(summary.used)}</span>
        <span>{Math.round((1 - usedShare) * 100)}% left</span>
      </div>
      <div className="mini-stats">
        <div>
          <span className="muted">From balance</span>
          <strong>{currency(summary.fromBalance)}</strong>
        </div>
        <div>
          <span className="muted">Not from balance</span>
          <strong>{currency(summary.notFromBalance)}</strong>
        </div>
      </div>
    </div>
  );
}
