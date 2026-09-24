import BottomSheet from "./ui/BottomSheet";
import MonthPicker from "./MonthPicker";

// Bottom sheet for picking the months a page shows.
export default function PeriodSheet({ selectedMonths, onChange, onClose }) {
  return (
    <BottomSheet
      title="Period"
      onClose={onClose}
      footer={
        <button type="button" className="btn btn-primary btn-block" onClick={onClose}>
          Done
        </button>
      }
    >
      <MonthPicker selectedMonths={selectedMonths} onChange={onChange} />
    </BottomSheet>
  );
}
