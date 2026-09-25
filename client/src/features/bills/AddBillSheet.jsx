import { useState } from "react";
import FormSheet from "../../components/ui/FormSheet";
import { createBill } from "./api";
import AddBillForm from "./AddBillForm";

const FORM_ID = "add-bill-form";

// Sheet for uploading a bill. `run` saves it (see BillsPage); onSaved gets
// the new bill so the caller can open it.
export default function AddBillSheet({ folders, initialFolderId, error, run, onSaved, onClose }) {
  const [saving, setSaving] = useState(false);

  async function handleSubmit(data) {
    if (saving) return;
    setSaving(true);
    let bill;
    const ok = await run(async () => (bill = await createBill(data)));
    setSaving(false);
    if (ok) onSaved(bill);
  }

  return (
    <FormSheet title="Add a bill" formId={FORM_ID} submitLabel={saving ? "Saving…" : "Save bill"} error={error} onClose={onClose}>
      <AddBillForm id={FORM_ID} folders={folders} initialFolderId={initialFolderId} onSubmit={handleSubmit} />
    </FormSheet>
  );
}
