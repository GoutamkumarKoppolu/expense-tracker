import { ExternalLink, FileText, Trash2 } from "lucide-react";
import BlobImage from "../../components/ui/BlobImage";
import { fileSize } from "../../utils/format";
import { pageKind } from "./domain";

// A bill's pages in order. Photos show in full (tap to open in the phone's
// viewer, to zoom); PDFs show as a row with an Open button. Pages can be
// deleted while more than one is left.
export default function PageList({ pages, onOpen, onDelete }) {
  const canDelete = pages.length > 1;

  return (
    <div className="page-list">
      {pages.map((p, i) => (
        <section key={p.id} className="card bill-page">
          <div className="bill-page-head">
            <span className="bill-page-title">
              Page {i + 1} <span className="muted">· {fileSize(p.size)}</span>
            </span>
            {canDelete && (
              <button type="button" className="icon-btn icon-btn-danger" onClick={() => onDelete(p)} aria-label={`Delete page ${i + 1}`}>
                <Trash2 size={18} />
              </button>
            )}
          </div>
          {pageKind(p.type) === "image" ? (
            <button type="button" className="bill-page-image" onClick={() => onOpen(p)} aria-label={`Open page ${i + 1}`}>
              <BlobImage blob={p.data} alt={`Page ${i + 1} of the bill`} />
            </button>
          ) : (
            <div className="bill-page-pdf">
              <span className="icon-badge tone-negative">
                <FileText size={20} />
              </span>
              <span className="bill-page-pdf-name">{p.name}</span>
              <button type="button" className="btn btn-soft" onClick={() => onOpen(p)}>
                <ExternalLink size={18} /> Open
              </button>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
