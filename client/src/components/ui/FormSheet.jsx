import { Trash2 } from "lucide-react";
import BottomSheet from "./BottomSheet";
import ErrorBanner from "./ErrorBanner";

// Bottom sheet around one form: submit in the footer, plus Delete when
// editing (`onDelete` set). The form inside must use `id={formId}`.
export default function FormSheet({ title, formId, submitLabel, error, onClose, onDelete, children }) {
  return (
    <BottomSheet
      title={title}
      onClose={onClose}
      footer={
        <>
          {onDelete && (
            <button type="button" className="btn btn-danger-ghost" onClick={onDelete}>
              <Trash2 size={18} /> Delete
            </button>
          )}
          <button type="submit" form={formId} className="btn btn-primary btn-block">
            {submitLabel}
          </button>
        </>
      }
    >
      <ErrorBanner message={error} />
      {children}
    </BottomSheet>
  );
}
