import { useState } from "react";
import { Pencil, Share2 } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import ErrorBanner from "../../components/ui/ErrorBanner";
import FormSheet from "../../components/ui/FormSheet";
import { dateHeading, fileSize, localDate } from "../../utils/format";
import { openFile, shareFiles } from "../../platform/files";
import { addPages, deleteBill, deletePage, updateBill } from "./api";
import EditBillForm from "./EditBillForm";
import FilePickers from "./FilePickers";
import PageList from "./PageList";

const EDIT_FORM_ID = "edit-bill-form";

// One bill: its pages, with open, share, add pages, rename/move and delete.
export default function BillView({ bill, folder, folders, error, setError, run, onBack }) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState("");

  // Opening/sharing doesn't change data, so it isn't routed through run().
  async function withBusy(label, action) {
    try {
      setError("");
      setBusy(label);
      await action();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy("");
    }
  }

  const handleOpen = (page) => withBusy("Opening…", () => openFile(page.name, page.data));
  const handleShare = () =>
    withBusy("Preparing…", () => shareFiles(bill.pages.map((p) => ({ name: p.name, blob: p.data })), bill.name));

  async function handleAddPages(files) {
    setBusy("Adding pages…");
    await run(() => addPages(bill.id, files));
    setBusy("");
  }

  function handleDeletePage(page) {
    if (window.confirm("Delete this page from the bill?")) run(() => deletePage(page.id));
  }

  async function handleDeleteBill() {
    if (!window.confirm(`Delete "${bill.name}" and its ${bill.pageCount} page${bill.pageCount === 1 ? "" : "s"}? This can't be undone.`)) return;
    if (await run(() => deleteBill(bill.id))) onBack();
  }

  return (
    <>
      <PageHeader
        title={bill.name}
        subtitle={`${folder.name} · ${bill.pageCount} page${bill.pageCount === 1 ? "" : "s"} · ${fileSize(bill.size)}`}
        onBack={onBack}
        actions={
          <button
            type="button"
            className="icon-btn"
            onClick={() => {
              setError("");
              setEditing(true);
            }}
            aria-label="Rename, move or delete bill"
          >
            <Pencil size={20} />
          </button>
        }
      />
      <div className="page-body">
        {!editing && <ErrorBanner message={error} onDismiss={() => setError("")} />}
        {busy && (
          <p className="muted" role="status">
            {busy}
          </p>
        )}

        <p className="muted">Added {dateHeading(localDate(bill.created_at))}</p>

        <PageList pages={bill.pages} onOpen={handleOpen} onDelete={handleDeletePage} />

        <FilePickers onPick={handleAddPages} chooseLabel="Add pages" />
        <button type="button" className="btn btn-primary btn-block" onClick={handleShare} disabled={Boolean(busy)}>
          <Share2 size={18} /> Share bill
        </button>
      </div>

      {editing && (
        <FormSheet
          title="Edit bill"
          formId={EDIT_FORM_ID}
          submitLabel="Save changes"
          error={error}
          onClose={() => {
            setEditing(false);
            setError("");
          }}
          onDelete={handleDeleteBill}
        >
          <EditBillForm
            id={EDIT_FORM_ID}
            bill={bill}
            folders={folders}
            onSubmit={async (data) => {
              if (await run(() => updateBill(bill.id, data))) {
                setEditing(false);
              }
            }}
          />
        </FormSheet>
      )}
    </>
  );
}
