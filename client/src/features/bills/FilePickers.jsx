import { useRef } from "react";
import { Camera, Paperclip } from "lucide-react";
import { ACCEPT } from "./domain";

// "Take photo" (camera) and "Choose files" (photos or PDFs, several at once).
// Calls onPick with the chosen File objects.
export default function FilePickers({ onPick, chooseLabel = "Choose files" }) {
  const camera = useRef(null);
  const chooser = useRef(null);

  function handleChange(e) {
    const files = [...(e.target.files || [])];
    e.target.value = ""; // allow picking the same file again
    if (files.length) onPick(files);
  }

  return (
    <div className="button-row">
      <input
        ref={camera}
        type="file"
        accept="image/*"
        capture="environment"
        className="visually-hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleChange}
      />
      <input
        ref={chooser}
        type="file"
        accept={ACCEPT}
        multiple
        className="visually-hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={handleChange}
      />
      <button type="button" className="btn btn-soft btn-block" onClick={() => camera.current.click()}>
        <Camera size={18} /> Take photo
      </button>
      <button type="button" className="btn btn-soft btn-block" onClick={() => chooser.current.click()}>
        <Paperclip size={18} /> {chooseLabel}
      </button>
    </div>
  );
}
