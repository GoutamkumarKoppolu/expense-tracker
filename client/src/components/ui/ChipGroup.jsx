// Multi-select chips. options: [{ value, label }], selected: value[]
export default function ChipGroup({ options, selected, onChange, label }) {
  function toggle(value) {
    onChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value]);
  }

  return (
    <div className="chip-group" role="group" aria-label={label}>
      {options.map((o) => (
        <button
          type="button"
          key={o.value}
          aria-pressed={selected.includes(o.value)}
          className={`chip ${selected.includes(o.value) ? "is-active" : ""}`}
          onClick={() => toggle(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
