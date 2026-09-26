import { useCallback, useEffect, useState } from "react";
import { ChevronDown, Handshake, Plus } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import SegmentedControl from "../../components/ui/SegmentedControl";
import EmptyState from "../../components/ui/EmptyState";
import ErrorBanner from "../../components/ui/ErrorBanner";
import FormSheet from "../../components/ui/FormSheet";
import Money from "../../components/ui/Money";
import { currency } from "../../utils/format";
import {
  createPayment,
  createRecord,
  deletePayment,
  deleteRecord,
  fetchBorrowingData,
  setCompleted,
  updatePayment,
  updateRecord,
} from "./api";
import { DIRECTIONS, maxPayment, summarizeDirection } from "./domain";
import RecordCard from "./RecordCard";
import RecordForm from "./RecordForm";
import PaymentForm from "./PaymentForm";

const RECORD_FORM_ID = "borrow-record-form";
const PAYMENT_FORM_ID = "borrow-payment-form";
const TABS = Object.entries(DIRECTIONS).map(([value, m]) => ({ value, label: m.tab }));

// Money borrowed from people and lent to people, one tab each. Switching tabs
// isn't a level, so Back from either tab goes to More. Nothing here touches
// the main balance.
export default function BorrowingPage({ navigate }) {
  const [direction, setDirection] = useState("borrowed");
  const meta = DIRECTIONS[direction];

  const [data, setData] = useState({ records: [], payments: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);
  // null | { kind: "record", record? } | { kind: "payment", record, payment? }
  const [sheet, setSheet] = useState(null);

  const load = useCallback(
    () =>
      fetchBorrowingData()
        .then(setData)
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false)),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  async function run(action) {
    try {
      setError("");
      await action();
      await load();
      return true;
    } catch (e) {
      setError(e.message);
      return false;
    }
  }

  function open(next) {
    setError("");
    setSheet(next);
  }

  function close() {
    setSheet(null);
    setError("");
  }

  async function submit(action) {
    if (await run(action)) setSheet(null);
  }

  const { active, completed, totals } = summarizeDirection(data.records, data.payments, direction);

  async function handleSaveRecord(form) {
    const editing = sheet.record;
    let saved;
    const ok = await run(async () => (saved = editing ? await updateRecord(editing.id, form) : await createRecord(direction, form)));
    if (ok) {
      setSheet(null);
      setOpenId(saved.id);
    }
  }

  // Both work from the card and from inside the edit sheet.
  function handleDeleteRecord(r) {
    const count = r.payments.length;
    const extra = count ? ` and its ${count} payment${count === 1 ? "" : "s"}` : "";
    if (window.confirm(`Delete ${currency(r.amount)} with ${r.person}${extra}? This can't be undone.`)) submit(() => deleteRecord(r.id));
  }

  function handleDeletePayment(p) {
    if (window.confirm(`Delete this ${currency(p.amount)} payment?`)) submit(() => deletePayment(p.id));
  }

  function toggleCompleted(record) {
    run(() => setCompleted(record.id, !record.completed));
  }

  const card = (r) => (
    <RecordCard
      key={r.id}
      record={r}
      meta={meta}
      open={openId === r.id}
      onToggle={() => setOpenId(openId === r.id ? null : r.id)}
      onAddPayment={(record) => open({ kind: "payment", record })}
      onOpenPayment={(record, payment) => open({ kind: "payment", record, payment })}
      onDeletePayment={handleDeletePayment}
      onEdit={(record) => open({ kind: "record", record })}
      onDelete={handleDeleteRecord}
      onToggleCompleted={toggleCompleted}
    />
  );

  return (
    <>
      <PageHeader title="Borrowed & lent" subtitle="Not linked to your balance" info="borrowing" onBack={() => navigate("more")} />
      <div className="page-body">
        <SegmentedControl
          label="Borrowed or lent"
          options={TABS}
          value={direction}
          onChange={(value) => {
            setOpenId(null);
            setShowCompleted(false);
            setDirection(value);
          }}
        />

        {!sheet && <ErrorBanner message={error} onDismiss={() => setError("")} />}

        <div className="card savings-summary">
          <span className="muted">{meta.outstanding}</span>
          <div className="savings-summary-amount">
            <Money value={totals.remaining} className="big-amount" />
            {active.length > 0 && (
              <span className="muted">
                across {active.length} {active.length === 1 ? "person" : "people"}
              </span>
            )}
          </div>
        </div>

        <button type="button" className="btn btn-primary btn-block" onClick={() => open({ kind: "record" })}>
          <Plus size={18} /> {meta.add}
        </button>

        {loading ? (
          <p className="muted">Loading…</p>
        ) : (
          <>
            {active.length ? (
              <div className="budget-list">{active.map(card)}</div>
            ) : (
              <EmptyState icon={Handshake}>{completed.length ? "Nothing pending. Completed ones are below." : meta.empty}</EmptyState>
            )}

            {completed.length > 0 && (
              <>
                <button
                  type="button"
                  className={`section-toggle ${showCompleted ? "is-open" : ""}`}
                  aria-expanded={showCompleted}
                  onClick={() => setShowCompleted((v) => !v)}
                >
                  <span>Completed ({completed.length})</span>
                  <ChevronDown size={18} />
                </button>
                {showCompleted && <div className="budget-list">{completed.map(card)}</div>}
              </>
            )}
          </>
        )}
      </div>

      {sheet?.kind === "record" && (
        <FormSheet
          title={sheet.record ? "Edit" : meta.add}
          formId={RECORD_FORM_ID}
          submitLabel={sheet.record ? "Save changes" : "Save"}
          error={error}
          onClose={close}
          onDelete={sheet.record ? () => handleDeleteRecord(sheet.record) : null}
        >
          <RecordForm id={RECORD_FORM_ID} record={sheet.record} meta={meta} onSubmit={handleSaveRecord} />
        </FormSheet>
      )}

      {sheet?.kind === "payment" && (
        <FormSheet
          title={`${sheet.payment ? "Edit" : meta.addPayment} · ${sheet.record.person}`}
          formId={PAYMENT_FORM_ID}
          submitLabel={sheet.payment ? "Save changes" : "Save"}
          error={error}
          onClose={close}
          onDelete={sheet.payment ? () => handleDeletePayment(sheet.payment) : null}
        >
          <PaymentForm
            id={PAYMENT_FORM_ID}
            payment={sheet.payment}
            max={maxPayment(sheet.record, sheet.payment)}
            onSubmit={(form) =>
              submit(() => (sheet.payment ? updatePayment(sheet.payment.id, form) : createPayment(sheet.record.id, form)))
            }
          />
        </FormSheet>
      )}
    </>
  );
}
