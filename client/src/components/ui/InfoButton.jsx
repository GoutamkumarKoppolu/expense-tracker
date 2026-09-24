import { useState } from "react";
import { Info, Lightbulb } from "lucide-react";
import BottomSheet from "./BottomSheet";
import { HELP } from "../../content/help";

// Small ⓘ button that explains a feature in a bottom sheet. `topic` is a key
// of HELP in content/help.js. Inside a <label>, give the label an explicit
// htmlFor: otherwise a tap on the label activates its first control, which
// would be this button. Its own clicks are stopped so the label's control
// isn't toggled.
export default function InfoButton({ topic }) {
  const [open, setOpen] = useState(false);
  const help = HELP[topic];
  if (!help) return null;

  return (
    <>
      <button
        type="button"
        className="info-btn"
        aria-label={`About: ${help.title}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
      >
        <Info size={16} />
      </button>
      {open && (
        <BottomSheet
          title={help.title}
          onClose={() => setOpen(false)}
          footer={
            <button type="button" className="btn btn-primary btn-block" onClick={() => setOpen(false)}>
              Got it
            </button>
          }
        >
          <div className="help-body">
            {help.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
            {help.example && (
              <div className="help-example">
                <Lightbulb size={18} aria-hidden="true" />
                <p>{help.example}</p>
              </div>
            )}
          </div>
        </BottomSheet>
      )}
    </>
  );
}
