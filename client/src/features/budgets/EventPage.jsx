import { useState } from "react";
import { CircleCheck, Layers, Pencil, Plus, RotateCcw } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import ErrorBanner from "../../components/ui/ErrorBanner";
import InfoButton from "../../components/ui/InfoButton";
import { eventSpends } from "./domain";
import {
  createSpend,
  createSubBudget,
  deleteBudget,
  deleteSpend,
  setEventDone,
  updateBudget,
  updateSpend,
} from "./api";
import FormSheet from "./FormSheet";
import BudgetForm from "./BudgetForm";
import SpendForm from "./SpendForm";
import BudgetSummary from "./BudgetSummary";
import SubBudgetList from "./SubBudgetList";
import SpendList from "./SpendList";

const EVENT_FORM_ID = "budget-event-form";
const SUB_FORM_ID = "budget-sub-form";
const SPEND_FORM_ID = "budget-spend-form";

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

// One event: its totals, sub-budgets and spends. `run(action)` comes from
// BudgetsPage: it reloads on success and returns false (with `error` set) on
// failure.
export default function EventPage({ event, spends, error, setError, run, onBack }) {
  // null = closed, { kind: "event" | "sub" | "spend", item? } otherwise.
  const [sheet, setSheet] = useState(null);
  const [selectedSubId, setSelectedSubId] = useState(null);

  const selectedSub = event.subs.find((s) => s.id === selectedSubId) ?? null;
  const shownSpends = eventSpends(event, spends, selectedSub?.id ?? null);

  function open(kind, item = null) {
    setError("");
    setSheet({ kind, item });
  }

  function closeSheet() {
    // An error from a failed attempt belongs to the sheet, not the page.
    setSheet(null);
    setError("");
  }

  async function submit(action) {
    if (await run(action)) setSheet(null);
  }

  async function handleDeleteEvent() {
    const count = eventSpends(event, spends).length;
    const parts = [event.subs.length && plural(event.subs.length, "sub-budget"), count && plural(count, "spend")];
    const extra = parts.filter(Boolean).join(" and ");
    if (!window.confirm(`Delete "${event.name}"${extra ? ` with its ${extra}` : ""}? This can't be undone.`)) return;
    if (await run(() => deleteBudget(event.id))) onBack();
  }

  async function handleDeleteSub(sub) {
    const count = eventSpends(event, spends, sub.id).length;
    const extra = count ? ` and its ${plural(count, "spend")}` : "";
    if (!window.confirm(`Delete sub-budget "${sub.name}"${extra}? They'll no longer count toward the total.`)) return;
    if (await run(() => deleteBudget(sub.id))) {
      setSheet(null);
      setSelectedSubId(null);
    }
  }

  async function handleDeleteSpend(spend) {
    if (!window.confirm("Delete this spend?")) return;
    submit(() => deleteSpend(spend.id));
  }

  const { kind, item } = sheet ?? {};

  return (
    <>
      <PageHeader
        title={event.name}
        subtitle={event.done ? "Marked as done" : "Not linked to your balance"}
        info="budgets"
        onBack={onBack}
        actions={
          <button type="button" className="icon-btn" onClick={() => open("event")} aria-label="Edit budget">
            <Pencil size={20} />
          </button>
        }
      />
      <div className="page-body">
        {!sheet && <ErrorBanner message={error} onDismiss={() => setError("")} />}

        <BudgetSummary event={event} />

        <div className="button-row">
          <button type="button" className="btn btn-primary btn-block" onClick={() => open("spend")}>
            <Plus size={18} /> Add spend
          </button>
          <button type="button" className="btn btn-soft btn-block" onClick={() => open("sub")}>
            <Layers size={18} /> Sub-budget
          </button>
        </div>

        {event.subs.length > 0 && (
          <>
            <div className="section-head">
              <h2 className="section-title-info">
                Sub-budgets <InfoButton topic="subBudgets" />
              </h2>
              <span className="muted">Tap one to see its spends</span>
            </div>
            <SubBudgetList subs={event.subs} selectedId={selectedSub?.id ?? null} onSelect={setSelectedSubId} />
          </>
        )}

        <div className="section-head">
          <h2>Spends{selectedSub && ` · ${selectedSub.name}`}</h2>
          {selectedSub && (
            <span className="section-head-actions">
              <button type="button" className="link-btn" onClick={() => open("sub", selectedSub)}>
                Edit
              </button>
              <button type="button" className="link-btn" onClick={() => setSelectedSubId(null)}>
                Show all
              </button>
            </span>
          )}
        </div>
        <SpendList spends={shownSpends} onOpen={(s) => open("spend", s)} />

        <button
          type="button"
          className="btn btn-soft btn-block"
          onClick={() => run(() => setEventDone(event.id, !event.done))}
        >
          {event.done ? <RotateCcw size={18} /> : <CircleCheck size={18} />}
          {event.done ? "Reopen budget" : "Mark as done"}
        </button>
      </div>

      {kind === "event" && (
        <FormSheet
          title="Edit budget"
          formId={EVENT_FORM_ID}
          submitLabel="Save changes"
          error={error}
          onClose={closeSheet}
          onDelete={handleDeleteEvent}
        >
          <BudgetForm
            id={EVENT_FORM_ID}
            budget={event}
            nameLabel="Name"
            onSubmit={(data) => submit(() => updateBudget(event.id, data))}
          />
        </FormSheet>
      )}

      {kind === "sub" && (
        <FormSheet
          title={item ? "Edit sub-budget" : "Add a sub-budget"}
          formId={SUB_FORM_ID}
          submitLabel={item ? "Save changes" : "Add sub-budget"}
          error={error}
          onClose={closeSheet}
          onDelete={item ? () => handleDeleteSub(item) : null}
        >
          <BudgetForm
            id={SUB_FORM_ID}
            budget={item}
            nameLabel="Sub-budget name"
            namePlaceholder="e.g. Modifications"
            onSubmit={(data) => submit(() => (item ? updateBudget(item.id, data) : createSubBudget(event.id, data)))}
          />
        </FormSheet>
      )}

      {kind === "spend" && (
        <FormSheet
          title={item ? "Edit spend" : `Add spend · ${event.name}`}
          formId={SPEND_FORM_ID}
          submitLabel={item ? "Save changes" : "Add spend"}
          error={error}
          onClose={closeSheet}
          onDelete={item ? () => handleDeleteSpend(item) : null}
        >
          <SpendForm
            id={SPEND_FORM_ID}
            event={event}
            spend={item}
            initialBudgetId={selectedSub?.id}
            onSubmit={(data) => submit(() => (item ? updateSpend(event.id, item.id, data) : createSpend(event.id, data)))}
          />
        </FormSheet>
      )}
    </>
  );
}
