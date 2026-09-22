import { useEffect, useRef, useState } from "react";

function useClickOutside(ref, onOutside) {
  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) onOutside();
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [ref, onOutside]);
}

function MultiSelectDropdown({ label, options, selected, onChange }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false));

  function toggle(value) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  const summary =
    selected.length === 0
      ? `All ${label}`
      : selected.length === 1
        ? options.find((o) => o.value === selected[0])?.label
        : `${selected.length} ${label} selected`;

  return (
    <div className="dropdown" ref={ref}>
      <button type="button" className="dropdown-toggle" onClick={() => setOpen((o) => !o)}>
        {summary} <span className="dropdown-caret">▾</span>
      </button>
      {open && (
        <div className="dropdown-panel">
          {options.map((o) => (
            <label className="dropdown-option" key={o.value}>
              <input type="checkbox" checked={selected.includes(o.value)} onChange={() => toggle(o.value)} />
              {o.label}
            </label>
          ))}
          {selected.length > 0 && (
            <button type="button" className="link-btn dropdown-clear" onClick={() => onChange([])}>
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}

const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1).padStart(2, "0"),
  label: new Date(2000, i, 1).toLocaleString(undefined, { month: "long" }),
}));

function yearOptions(span = 6) {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear; y > currentYear - span; y--) {
    years.push({ value: String(y), label: String(y) });
  }
  return years;
}

const YEAR_OPTIONS = yearOptions();
const ALL_MONTH_VALUES = MONTH_OPTIONS.map((m) => m.value);
const ALL_YEAR_VALUES = YEAR_OPTIONS.map((y) => y.value);

// Drop-in replacement for the old chip-based month picker: same
// (selectedMonths, onChange) contract of flat "YYYY-MM" strings, built here
// from two independent multi-selects (years x months) instead of a fixed
// list of the last 12 months.
//
// The two axes' raw picks are owned as local state rather than derived from
// `selectedMonths`, because the emitted value expands an empty axis to
// "all" (see `emit` below) — deriving the checkboxes back from that
// expanded output would make e.g. clearing Years while a month is still
// picked immediately look re-checked, since the emitted list would still
// span every year.
export default function YearMonthSelector({ selectedMonths, onChange }) {
  const [pickedYears, setPickedYears] = useState(() => [
    ...new Set(selectedMonths.map((m) => m.slice(0, 4))),
  ]);
  const [pickedMonths, setPickedMonths] = useState(() => [
    ...new Set(selectedMonths.map((m) => m.slice(5, 7))),
  ]);

  // An empty axis means "all" of that axis, e.g. picking only year 2026
  // (no months checked) filters the whole year rather than clearing the
  // year too. Only clear the filter entirely when neither axis has a pick.
  function emit(years, monthNums) {
    if (!years.length && !monthNums.length) {
      onChange([]);
      return;
    }
    const yrs = years.length ? years : ALL_YEAR_VALUES;
    const mos = monthNums.length ? monthNums : ALL_MONTH_VALUES;
    const combined = [];
    yrs.forEach((y) => mos.forEach((mm) => combined.push(`${y}-${mm}`)));
    onChange(combined);
  }

  function handleYearsChange(years) {
    setPickedYears(years);
    emit(years, pickedMonths);
  }

  function handleMonthsChange(monthNums) {
    setPickedMonths(monthNums);
    emit(pickedYears, monthNums);
  }

  return (
    <div className="year-month-selector">
      <MultiSelectDropdown label="years" options={YEAR_OPTIONS} selected={pickedYears} onChange={handleYearsChange} />
      <MultiSelectDropdown
        label="months"
        options={MONTH_OPTIONS}
        selected={pickedMonths}
        onChange={handleMonthsChange}
      />
    </div>
  );
}
