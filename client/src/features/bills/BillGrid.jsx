import { FileText } from "lucide-react";
import BlobImage from "../../components/ui/BlobImage";
import { fileSize, localDate, shortDate } from "../../utils/format";

// Bill tiles, two per row. `folderName` (id → name) adds the folder under
// each bill, for search results that span folders.
export default function BillGrid({ bills, onOpen, folderName }) {
  return (
    <div className="file-grid">
      {bills.map((b) => (
        <button type="button" key={b.id} className="card file-tile" onClick={() => onOpen(b)}>
          <span className="file-tile-cover">
            {b.cover?.thumb ? <BlobImage blob={b.cover.thumb} alt="" /> : <FileText size={34} aria-hidden="true" />}
            {b.pageCount > 1 && <span className="file-tile-badge">{b.pageCount} pages</span>}
          </span>
          <span className="file-tile-name">{b.name}</span>
          <span className="file-tile-meta">
            {folderName ? folderName.get(b.folder_id) : shortDate(localDate(b.created_at))} · {fileSize(b.size)}
          </span>
        </button>
      ))}
    </div>
  );
}
