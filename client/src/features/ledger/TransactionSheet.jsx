import { useEffect } from "react";
import { Trash2 } from "lucide-react";
import BottomSheet from "../../components/ui/BottomSheet";
import ErrorBanner from "../../components/ui/ErrorBanner";
import TransactionForm from "./TransactionForm";
import { useLedger } from "./ledgerContext";

const FORM_ID = "transaction-form";

// Add (transaction = null) or edit/delete a ledger transaction.
export default function TransactionSheet({ transaction, onClose }) {
  const { options, tags, error, setError, saveTransaction, removeTransaction } = useLedger();

  // Don't carry an error from the page into the sheet, or back out of it.
  useEffect(() => {
    setError("");
    return () => setError("");
  }, [setError]);

  async function handleSubmit(data) {
    if (await saveTransaction(data, transaction?.id)) onClose();
  }

  async function handleDelete() {
    if (!window.confirm("Delete this transaction?")) return;
    if (await removeTransaction(transaction.id)) onClose();
  }

  return (
    <BottomSheet
      title={transaction ? "Edit transaction" : "Add transaction"}
      onClose={onClose}
      footer={
        <>
          {transaction && (
            <button type="button" className="btn btn-danger-ghost" onClick={handleDelete}>
              <Trash2 size={18} /> Delete
            </button>
          )}
          <button type="submit" form={FORM_ID} className="btn btn-primary btn-block">
            {transaction ? "Save changes" : "Add transaction"}
          </button>
        </>
      }
    >
      <ErrorBanner message={error} />
      <TransactionForm
        id={FORM_ID}
        transaction={transaction}
        transactionTypes={options["transaction-types"]}
        paymentMethods={options["payment-methods"]}
        paymentSources={options["payment-sources"]}
        existingTags={tags}
        onSubmit={handleSubmit}
      />
    </BottomSheet>
  );
}
