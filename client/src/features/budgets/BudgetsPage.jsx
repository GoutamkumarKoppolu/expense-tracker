import { useCallback, useEffect, useState } from "react";
import { ChevronDown, Plus, Wallet } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";
import ErrorBanner from "../../components/ui/ErrorBanner";
import { createEvent, fetchBudgetData } from "./api";
import { summarizeEvent, summarizeEvents } from "./domain";
import FormSheet from "../../components/ui/FormSheet";
import BudgetForm from "./BudgetForm";
import EventCard from "./EventCard";
import EventPage from "./EventPage";

const NEW_EVENT_FORM_ID = "budget-new-event-form";

// Budgets for events (a wedding, a car). "#/budgets" lists them;
// "#/budgets/<id>" opens one, so the Android back button returns to the
// list. Owns the data and loading for both; nothing here touches the ledger.
export default function BudgetsPage({ navigate, param }) {
  const [data, setData] = useState({ budgets: [], spends: [] });
  const [loading, setLoading] = useState(true);
  // An error belongs to the screen it happened on: going to another one
  // (including with the back button) hides it.
  const [errorAt, setErrorAt] = useState({ param, message: "" });
  const error = errorAt.param === param ? errorAt.message : "";
  const setError = useCallback((message) => setErrorAt({ param, message }), [param]);
  const [showNew, setShowNew] = useState(false);
  const [showDone, setShowDone] = useState(false);

  const load = useCallback(
    () =>
      fetchBudgetData()
        .then(setData)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false)),
    [setError]
  );

  useEffect(() => {
    load();
  }, [load]);

  // Runs a mutation, then reloads. Returns false and shows the error if it fails.
  const run = useCallback(
    async (action) => {
      try {
        setError("");
        await action();
        await load();
        return true;
      } catch (e) {
        setError(e.message);
        return false;
      }
    },
    [load, setError]
  );

  const openEvent = (id) => navigate(`budgets/${id}`);
  const backToList = () => navigate("budgets");

  if (param) {
    const event = summarizeEvent(Number(param), data.budgets, data.spends);
    if (event) {
      return (
        <EventPage
          key={event.id}
          event={event}
          spends={data.spends}
          error={error}
          setError={setError}
          run={run}
          onBack={backToList}
        />
      );
    }
    return (
      <>
        <PageHeader title="Budget" onBack={backToList} />
        <div className="page-body">
          {loading ? <p className="muted">Loading…</p> : <EmptyState icon={Wallet}>This budget was deleted.</EmptyState>}
        </div>
      </>
    );
  }

  const { active, done } = summarizeEvents(data.budgets, data.spends);

  async function handleCreate(form) {
    let created;
    if (await run(async () => (created = await createEvent(form)))) {
      setShowNew(false);
      openEvent(created.id);
    }
  }

  return (
    <>
      <PageHeader
        title="Budgets"
        subtitle="Plan spending for an event"
        info="budgets"
        onBack={() => navigate("more")}
      />
      <div className="page-body">
        {!showNew && <ErrorBanner message={error} onDismiss={() => setError("")} />}

        <button
          type="button"
          className="btn btn-primary btn-block"
          onClick={() => {
            setError("");
            setShowNew(true);
          }}
        >
          <Plus size={18} /> New budget
        </button>

        {loading ? (
          <p className="muted">Loading…</p>
        ) : (
          <>
            {active.length ? (
              <div className="budget-list">
                {active.map((e) => (
                  <EventCard key={e.id} event={e} onOpen={openEvent} />
                ))}
              </div>
            ) : (
              <EmptyState icon={Wallet}>
                {done.length
                  ? "No active budgets. The ones you marked as done are below."
                  : "No budgets yet. Add one for an event like a wedding or a car, then note down what you spend."}
              </EmptyState>
            )}

            {done.length > 0 && (
              <>
                <button
                  type="button"
                  className={`section-toggle ${showDone ? "is-open" : ""}`}
                  aria-expanded={showDone}
                  onClick={() => setShowDone((v) => !v)}
                >
                  <span>Done ({done.length})</span>
                  <ChevronDown size={18} />
                </button>
                {showDone && (
                  <div className="budget-list">
                    {done.map((e) => (
                      <EventCard key={e.id} event={e} onOpen={openEvent} />
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {showNew && (
        <FormSheet
          title="New budget"
          formId={NEW_EVENT_FORM_ID}
          submitLabel="Create budget"
          error={error}
          onClose={() => {
            setShowNew(false);
            setError("");
          }}
        >
          <BudgetForm
            id={NEW_EVENT_FORM_ID}
            nameLabel="What's it for?"
            namePlaceholder="e.g. Wedding, New car"
            onSubmit={handleCreate}
          />
        </FormSheet>
      )}
    </>
  );
}
