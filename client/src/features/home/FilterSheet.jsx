import BottomSheet from "../../components/ui/BottomSheet";
import ChipGroup from "../../components/ui/ChipGroup";
import SegmentedControl from "../../components/ui/SegmentedControl";
import MonthPicker from "../../components/MonthPicker";
import { DEDUCTION_FILTERS } from "../../domain/transactions";
import { DEDUCTION_OPTIONS, KIND_OPTIONS } from "./filterOptions";

// All Home filters in one sheet. Filters apply live; the balance-deduction
// filter only exists for savings, so it appears once "Saving" is picked.
export default function FilterSheet({ filters, tags, onChange, onReset, onClose }) {
  return (
    <BottomSheet
      title="Filters"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onReset}>
            Reset
          </button>
          <button type="button" className="btn btn-primary btn-block" onClick={onClose}>
            Show results
          </button>
        </>
      }
    >
      <div className="sheet-section">
        <h3>Period</h3>
        <MonthPicker selectedMonths={filters.months} onChange={(months) => onChange({ months })} />
      </div>

      <div className="sheet-section">
        <h3>Transaction type</h3>
        <SegmentedControl
          label="Transaction type"
          options={KIND_OPTIONS}
          value={filters.kind}
          onChange={(kind) => onChange({ kind, deduction: DEDUCTION_FILTERS.ALL })}
        />
      </div>

      {filters.kind === "saving" && (
        <div className="sheet-section">
          <h3>Balance deduction</h3>
          <SegmentedControl
            label="Balance deduction"
            options={DEDUCTION_OPTIONS}
            value={filters.deduction}
            onChange={(deduction) => onChange({ deduction })}
          />
        </div>
      )}

      <div className="sheet-section">
        <h3>Tags</h3>
        {tags.length ? (
          <ChipGroup
            label="Tags"
            options={tags.map((t) => ({ value: t, label: t }))}
            selected={filters.tags}
            onChange={(selected) => onChange({ tags: selected })}
          />
        ) : (
          <p className="field-hint">Tags appear here once you add transactions.</p>
        )}
      </div>
    </BottomSheet>
  );
}
