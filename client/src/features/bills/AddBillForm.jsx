import { useState } from "react";
import { FileText, Image, X } from "lucide-react";
import { fileSize } from "../../utils/format";
import { defaultBillName, pageKind } from "./domain";
import FilePickers from "./FilePickers";

const NEW_FOLDER = "new";

// Upload one bill: pick a folder (or name a new one), add one or more pages
// (photos or PDFs), name it. Submitted by the sheet's footer button via the
// `id`/`form` attribute.
export default function AddBillForm({ id, folders, initialFolderId, onSubmit }) {
  const [folder, setFolder] = useState(() => initialFolderId ?? folders[0]?.id ?? NEW_FOLDER);
  const [newFolderName, setNewFolderName] = useState("");
  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [files, setFiles] = useState([]);

  function addFiles(picked) {
    const next = [...files, ...picked];
    setFiles(next);
    if (!nameTouched) setName(defaultBillName(next[0].name));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      name: name.trim(),
      files,
      ...(folder === NEW_FOLDER ? { newFolderName: newFolderName.trim() } : { folderId: folder }),
    });
  }

  return (
    <form id={id} className="form" onSubmit={handleSubmit}>
      <div className="field">
        <span className="field-label">Folder</span>
        <div className="chip-group" role="radiogroup" aria-label="Folder">
          {folders.map((f) => (
            <button
              type="button"
              key={f.id}
              role="radio"
              aria-checked={folder === f.id}
              className={`chip ${folder === f.id ? "is-active" : ""}`}
              onClick={() => setFolder(f.id)}
            >
              {f.name}
            </button>
          ))}
          <button
            type="button"
            role="radio"
            aria-checked={folder === NEW_FOLDER}
            className={`chip ${folder === NEW_FOLDER ? "is-active" : ""}`}
            onClick={() => setFolder(NEW_FOLDER)}
          >
            + New folder
          </button>
        </div>
      </div>

      {folder === NEW_FOLDER && (
        <label className="field">
          <span className="field-label">New folder name</span>
          <input
            className="input"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            placeholder="e.g. Electricity, Car service"
            required
          />
        </label>
      )}

      <div className="field">
        <span className="field-label">Pages</span>
        {files.length > 0 && (
          <div className="card card-list upload-list">
            {files.map((f, i) => (
              <div className="upload-row" key={`${f.name}-${i}`}>
                <span className="icon-badge tone-accent">
                  {pageKind(f.type) === "pdf" ? <FileText size={18} /> : <Image size={18} />}
                </span>
                <span className="upload-text">
                  <span className="upload-name">{f.name}</span>
                  <span className="upload-meta">{fileSize(f.size)}</span>
                </span>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => setFiles((current) => current.filter((_, j) => j !== i))}
                  aria-label={`Remove ${f.name}`}
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        )}
        <FilePickers onPick={addFiles} chooseLabel={files.length ? "Add more" : "Choose files"} />
        <span className="field-hint">Photos or PDFs, kept at their original size. Several files make one bill with several pages.</span>
      </div>

      <label className="field">
        <span className="field-label">Bill name</span>
        <input
          className="input"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setNameTouched(true);
          }}
          placeholder="e.g. Fridge invoice"
          required
        />
      </label>
    </form>
  );
}
