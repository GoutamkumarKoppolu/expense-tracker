import { Folder } from "lucide-react";
import BlobImage from "../../components/ui/BlobImage";
import { fileSize } from "../../utils/format";

// Folder tiles, two per row: a preview from the newest photo bill, the name
// and how many bills it holds.
export default function FolderGrid({ folders, onOpen }) {
  return (
    <div className="file-grid">
      {folders.map((f) => (
        <button type="button" key={f.id} className="card file-tile" onClick={() => onOpen(f.id)}>
          <span className="file-tile-cover">
            {f.cover ? <BlobImage blob={f.cover.thumb} alt="" /> : <Folder size={34} aria-hidden="true" />}
          </span>
          <span className="file-tile-name">{f.name}</span>
          <span className="file-tile-meta">
            {f.billCount} bill{f.billCount === 1 ? "" : "s"}
            {f.size > 0 && ` · ${fileSize(f.size)}`}
          </span>
        </button>
      ))}
    </div>
  );
}
