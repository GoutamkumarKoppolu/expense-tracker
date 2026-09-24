import { useEffect, useId } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

// Modal panel that slides up from the bottom (One UI style): content and
// actions sit in thumb reach. Closes on backdrop tap, the X button or Escape.
// Rendered into <body> so it never sits inside a <label> or other element
// whose native click behaviour could fire (e.g. an InfoButton in a label).
// Open sheets, innermost last, so Escape closes only the top one (an info
// sheet can open on top of the add-transaction sheet).
const openSheets = [];

export default function BottomSheet({ title, onClose, footer, children }) {
  const titleId = useId();

  useEffect(() => {
    openSheets.push(titleId);
    return () => openSheets.splice(openSheets.indexOf(titleId), 1);
  }, [titleId]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && openSheets[openSheets.length - 1] === titleId && onClose();
    document.addEventListener("keydown", onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [onClose, titleId]);

  return createPortal(
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sheet-handle" aria-hidden="true" />
        <div className="sheet-head">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-footer">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
