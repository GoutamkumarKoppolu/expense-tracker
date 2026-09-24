import { useState } from "react";
import ChipGroup from "./ui/ChipGroup";

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1).padStart(2, "0"),
  label: new Date(2000, i, 1).toLocaleString("en-IN", { month: "short" }),
}));

function yearOptions(span = 6) {
  const currentYear = new Date().getFullYear();
  return Array.from({ length: span }, (_, i) => ({ value: String(currentYear - i), label: String(currentYear - i) }));
}

const YEAR_OPTIONS = yearOptions();
const ALL_MONTH_VALUES = MONTH_OPTIONS.map((m) => m.value);
const ALL_YEAR_VALUES = YEAR_OPTIONS.map((y) => y.value);

// Years × months picker with a (selectedMonths, onChange) contract of flat
// "YYYY-MM" strings. The two axes' raw picks are local state rather than
// derived from `selectedMonths`, because an empty axis is emitted as "all"
// of that axis — deriving the chips back from that expanded output would
// make clearing one axis look like it re-selected everything.
export default function MonthPicker({ selectedMonths, onChange }) {
  const [pickedYears, setPickedYears] = useState(() => [...new Set(selectedMonths.map((m) => m.slice(0, 4)))]);
  const [pickedMonths, setPickedMonths] = useState(() => [...new Set(selectedMonths.map((m) => m.slice(5, 7)))]);

  // Only clear the filter entirely when neither axis has a pick.
  function emit(years, monthNums) {
    if (!years.length && !monthNums.length) {
      onChange([]);
      return;
    }
    const yrs = years.length ? years : ALL_YEAR_VALUES;
    const mos = monthNums.length ? monthNums : ALL_MONTH_VALUES;
    onChange(yrs.flatMap((y) => mos.map((mm) => `${y}-${mm}`)));
  }

  return (
    <div className="month-picker">
      <span className="field-label">Years</span>
      <ChipGroup
        label="Years"
        options={YEAR_OPTIONS}
        selected={pickedYears}
        onChange={(years) => {
          setPickedYears(years);
          emit(years, pickedMonths);
        }}
      />
      <span className="field-label">Months</span>
      <ChipGroup
        label="Months"
        options={MONTH_OPTIONS}
        selected={pickedMonths}
        onChange={(monthNums) => {
          setPickedMonths(monthNums);
          emit(pickedYears, monthNums);
        }}
      />
      <p className="field-hint">Leave a row empty to include all of it. Clear both for all time.</p>
    </div>
  );
}
