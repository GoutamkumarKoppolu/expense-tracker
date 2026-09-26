import { useCallback, useEffect, useState } from "react";
import { ReceiptText } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import EmptyState from "../../components/ui/EmptyState";
import { fetchBillsData } from "./api";
import { summarizeBills, summarizeFolders } from "./domain";
import BillsHome from "./BillsHome";
import FolderView from "./FolderView";
import BillView from "./BillView";

// Bills: "#/bills" shows the folders, "#/bills/<folder>" one folder and
// "#/bills/<folder>/<bill>" one bill, so the Android back button steps back
// through them. Owns the data and loading for all three.
export default function BillsPage({ navigate, param }) {
  const [data, setData] = useState({ folders: [], bills: [], pages: [] });
  const [loading, setLoading] = useState(true);
  // An error belongs to the screen it happened on: going to another one
  // (including with the back button) hides it.
  const [errorAt, setErrorAt] = useState({ param, message: "" });
  const error = errorAt.param === param ? errorAt.message : "";
  const setError = useCallback((message) => setErrorAt({ param, message }), [param]);

  const load = useCallback(
    () =>
      fetchBillsData()
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

  const bills = summarizeBills(data.bills, data.pages);
  const folders = summarizeFolders(data.folders, bills);
  const [folderParam, billParam] = (param || "").split("/");
  const shared = { folders, error, setError, run };
  const openBill = (bill) => navigate(`bills/${bill.folder_id}/${bill.id}`);

  if (billParam) {
    // Found by its own id, so it still opens after being moved to another folder.
    const bill = bills.find((b) => b.id === Number(billParam));
    const folder = bill && folders.find((f) => f.id === bill.folder_id);
    if (bill && folder) {
      return <BillView key={bill.id} {...shared} bill={bill} folder={folder} onBack={() => navigate(`bills/${folder.id}`)} />;
    }
  } else if (folderParam) {
    const folder = folders.find((f) => f.id === Number(folderParam));
    if (folder) {
      return (
        <FolderView
          key={folder.id}
          {...shared}
          folder={folder}
          bills={bills.filter((b) => b.folder_id === folder.id)}
          navigate={navigate}
          onBack={() => navigate("bills")}
          onOpenBill={openBill}
        />
      );
    }
  } else {
    return <BillsHome {...shared} bills={bills} navigate={navigate} onOpenBill={openBill} />;
  }

  return (
    <>
      <PageHeader title="Bills" onBack={() => navigate("bills")} />
      <div className="page-body">
        {loading ? <p className="muted">Loading…</p> : <EmptyState icon={ReceiptText}>This was deleted.</EmptyState>}
      </div>
    </>
  );
}
