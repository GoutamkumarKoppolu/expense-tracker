import { useCallback, useEffect, useState } from "react";
import { createWithdrawal, deleteWithdrawal, fetchSavingsData } from "./api";
import { buildHistory, computePots, summarizePots } from "./domain";
import SavingsSummary from "./SavingsSummary";
import PotList from "./PotList";
import WithdrawalForm from "./WithdrawalForm";
import SavingsHistory from "./SavingsHistory";

// Self-contained feature page: owns its state and data loading.
export default function SavingsPage() {
  const [data, setData] = useState({ savings: [], withdrawals: [] });
  const [selectedTag, setSelectedTag] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    fetchSavingsData()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(load, [load]);

  const pots = computePots(data.savings, data.withdrawals);
  const history = buildHistory(data.savings, data.withdrawals, selectedTag);

  async function handleWithdraw(form) {
    try {
      setError("");
      await createWithdrawal(form);
      load();
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  }

  async function handleDeleteWithdrawal(id) {
    try {
      setError("");
      await deleteWithdrawal(id);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  if (loading) return <p>Loading…</p>;

  return (
    <>
      {error && <div className="error-banner">{error}</div>}

      <section className="card">
        <h2>Savings overview</h2>
        <SavingsSummary summary={summarizePots(pots)} />
      </section>

      <section className="card">
        <h2>Pots</h2>
        <PotList pots={pots} selectedTag={selectedTag} onSelect={setSelectedTag} />
      </section>

      <section className="card">
        <h2>Use savings</h2>
        <WithdrawalForm pots={pots} onSubmit={handleWithdraw} />
      </section>

      <section className="card">
        <div className="section-head">
          <h2>History{selectedTag && ` — ${selectedTag}`}</h2>
          {selectedTag && (
            <button type="button" className="link-btn" onClick={() => setSelectedTag("")}>
              Show all pots
            </button>
          )}
        </div>
        <SavingsHistory entries={history} onDeleteWithdrawal={handleDeleteWithdrawal} />
      </section>
    </>
  );
}
