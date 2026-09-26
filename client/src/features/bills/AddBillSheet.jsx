import { useState } from "react";
import FormSheet from "../../components/ui/FormSheet";
import { createBills } from "./api";
import AddBillForm from "./AddBillForm";

const FORM_ID = "add-bill-form";

// Sheet for uploading bills (one per file). `run` saves them (see
// BillsPage); onSaved gets the new bills so the caller can show them.
export default function AddBillSheet({ folders, initialFolderId, error, run, onSaved, onClose }) {
  const [saving, setSaving] = useState(false);
  const [count, setCount] = useState(0);

  async function handleSubmit(data) {
    if (saving) return;
    setSaving(true);
    let bills;
    const ok = await run(async () => (bills = await createBills(data)));
    setSaving(false);
    if (ok) onSaved(bills);
  }

  const label = count > 1 ? `Save ${count} bills` : "Save bill";

  return (
    <FormSheet title="Add bills" formId={FORM_ID} submitLabel={saving ? "Saving…" : label} error={error} onClose={onClose}>
      <AddBillForm
        id={FORM_ID}
        folders={folders}
        initialFolderId={initialFolderId}
        onSubmit={handleSubmit}
        onCountChange={setCount}
      />
    </FormSheet>
  );
}
