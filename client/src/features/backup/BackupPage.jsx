import { useRef, useState } from "react";
import { CircleCheck, Download, TriangleAlert, Upload } from "lucide-react";
import PageHeader from "../../components/ui/PageHeader";
import BottomSheet from "../../components/ui/BottomSheet";
import ErrorBanner from "../../components/ui/ErrorBanner";
import { dateHeading, localDate, today } from "../../utils/format";
import { TABLE_LABELS, parseBackup } from "./backupFormat";
import { exportBackup, restoreBackup } from "./api";
import { saveTextFile } from "./fileio";

const LAST_EXPORT_KEY = "expense-tracker.lastExport";

function readLastExport() {
  try {
    return localStorage.getItem(LAST_EXPORT_KEY);
  } catch {
    return null;
  }
}

// Import confirmation: what's in the file, and a clear "this replaces" warning.
function ImportSheet({ parsed, busy, error, onExportFirst, onConfirm, onClose }) {
  const { summary } = parsed;
  return (
    <BottomSheet
      title="Restore this backup?"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onExportFirst} disabled={busy}>
            Export current first
          </button>
          <button type="button" className="btn btn-danger btn-block" onClick={onConfirm} disabled={busy}>
            {busy ? "Restoring…" : "Replace my data"}
          </button>
        </>
      }
    >
      <ErrorBanner message={error} />
      {summary.exportedAt && <p className="muted backup-meta">Backup from {dateHeading(localDate(summary.exportedAt))}</p>}
      <div className="card card-list backup-counts">
        {Object.entries(summary.counts).map(([table, count]) => (
          <div className="backup-count-row" key={table}>
            <span>{TABLE_LABELS[table]}</span>
            <strong>{count}</strong>
          </div>
        ))}
      </div>
      {summary.missingTables.length > 0 && (
        <p className="field-hint">
          This backup is from an older version of the app. {summary.missingTables.map((t) => TABLE_LABELS[t]).join(", ")} will
          start empty. Everything else is brought up to date automatically.
        </p>
      )}
      <div className="warning-note">
        <TriangleAlert size={18} aria-hidden="true" />
        <p>This replaces all the data on this device with the backup. Export your current data first if you might need it.</p>
      </div>
    </BottomSheet>
  );
}

export default function BackupPage({ navigate }) {
  const fileInput = useRef(null);
  const [lastExport, setLastExport] = useState(readLastExport);
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState("");
  const [sheetError, setSheetError] = useState("");
  const [busy, setBusy] = useState(false);
  const [restored, setRestored] = useState(false);

  async function handleExport() {
    try {
      setError("");
      setSheetError("");
      const backup = await exportBackup();
      const saved = await saveTextFile(`expense-tracker-backup-${today()}.json`, JSON.stringify(backup, null, 2));
      if (saved) {
        const now = new Date().toISOString();
        try {
          localStorage.setItem(LAST_EXPORT_KEY, now);
        } catch {
          // Only affects the "last exported" hint.
        }
        setLastExport(now);
      }
    } catch (e) {
      (parsed ? setSheetError : setError)(`Export failed: ${e.message}`);
    }
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again
    if (!file) return;
    try {
      setError("");
      setSheetError("");
      setParsed(parseBackup(await file.text()));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRestore() {
    try {
      setBusy(true);
      setSheetError("");
      await restoreBackup(parsed);
      setParsed(null);
      setRestored(true);
    } catch (e) {
      setSheetError(`Nothing was changed. ${e.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Backup & restore" subtitle="Keep your data when you change phones" info="backup" onBack={() => navigate("more")} />
      <div className="page-body">
        <ErrorBanner message={error} onDismiss={() => setError("")} />

        {restored && (
          <div className="success-note" role="status">
            <CircleCheck size={20} aria-hidden="true" />
            <div>
              <p>Backup restored.</p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  // Fresh start so every page reloads the restored data.
                  window.location.hash = "/home";
                  window.location.reload();
                }}
              >
                Open the app
              </button>
            </div>
          </div>
        )}

        <section className="card backup-card">
          <span className="icon-badge tone-accent">
            <Download size={20} />
          </span>
          <h2>Export</h2>
          <p className="muted">
            Saves all your transactions, savings, credit cards, options and theme to one file. Do this before uninstalling the app
            or changing phones, and keep the file somewhere safe (Drive, email to yourself).
          </p>
          <p className="muted backup-meta">
            {lastExport ? `Last exported: ${dateHeading(localDate(lastExport))}` : "You haven't exported a backup on this device yet."}
          </p>
          <button type="button" className="btn btn-primary btn-block" onClick={handleExport}>
            <Download size={18} /> Export backup
          </button>
        </section>

        <section className="card backup-card">
          <span className="icon-badge tone-savings">
            <Upload size={20} />
          </span>
          <h2>Import</h2>
          <p className="muted">
            Restores a backup file into this app. Backups from older versions are upgraded automatically. You'll see what's in the
            file before anything changes.
          </p>
          <input ref={fileInput} type="file" className="visually-hidden" tabIndex={-1} aria-hidden="true" onChange={handleFile} />
          <button type="button" className="btn btn-soft btn-block" onClick={() => fileInput.current.click()}>
            <Upload size={18} /> Import backup
          </button>
        </section>
      </div>

      {parsed && (
        <ImportSheet
          parsed={parsed}
          busy={busy}
          error={sheetError}
          onExportFirst={handleExport}
          onConfirm={handleRestore}
          onClose={() => {
            setParsed(null);
            setSheetError("");
          }}
        />
      )}
    </>
  );
}
