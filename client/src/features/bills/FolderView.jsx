import { useState } from "react";
import { Pencil, Plus, ReceiptText } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";
import ErrorBanner from "../../components/ui/ErrorBanner";
import FormSheet from "../../components/ui/FormSheet";
import { fileSize } from "../../utils/format";
import { deleteFolder, renameFolder } from "./api";
import BillGrid from "./BillGrid";
import NameForm from "./NameForm";
import AddBillSheet from "./AddBillSheet";

const RENAME_FORM_ID = "rename-bill-folder-form";

// One folder's bills, newest first.
export default function FolderView({ folder, bills, folders, error, setError, run, onBack, onOpenBill }) {
  const [sheet, setSheet] = useState(null); // null | "bill" | "edit"

  function open(kind) {
    setError("");
    setSheet(kind);
  }

  function close() {
    setSheet(null);
    setError("");
  }

  async function handleDelete() {
    const extra = bills.length ? ` and its ${bills.length} bill${bills.length === 1 ? "" : "s"} (${fileSize(folder.size)})` : "";
    if (!window.confirm(`Delete the folder "${folder.name}"${extra}? This can't be undone.`)) return;
    if (await run(() => deleteFolder(folder.id))) onBack();
  }

  return (
    <>
      <PageHeader
        title={folder.name}
        subtitle={`${bills.length} bill${bills.length === 1 ? "" : "s"}${folder.size ? ` · ${fileSize(folder.size)}` : ""}`}
        onBack={onBack}
        actions={
          <button type="button" className="icon-btn" onClick={() => open("edit")} aria-label="Rename or delete folder">
            <Pencil size={20} />
          </button>
        }
      />
      <div className="page-body">
        {!sheet && <ErrorBanner message={error} onDismiss={() => setError("")} />}

        <button type="button" className="btn btn-primary btn-block" onClick={() => open("bill")}>
          <Plus size={18} /> Add bill
        </button>

        {bills.length ? (
          <BillGrid bills={bills} onOpen={onOpenBill} />
        ) : (
          <EmptyState icon={ReceiptText}>This folder is empty. Add a bill to it.</EmptyState>
        )}
      </div>

      {sheet === "bill" && (
        <AddBillSheet
          folders={folders}
          initialFolderId={folder.id}
          error={error}
          run={run}
          onClose={close}
          onSaved={(bill) => {
            setSheet(null);
            onOpenBill(bill);
          }}
        />
      )}

      {sheet === "edit" && (
        <FormSheet
          title="Edit folder"
          formId={RENAME_FORM_ID}
          submitLabel="Save changes"
          error={error}
          onClose={close}
          onDelete={handleDelete}
        >
          <NameForm
            id={RENAME_FORM_ID}
            label="Folder name"
            initialName={folder.name}
            onSubmit={async (name) => {
              if (await run(() => renameFolder(folder.id, name))) setSheet(null);
            }}
          />
        </FormSheet>
      )}
    </>
  );
}
