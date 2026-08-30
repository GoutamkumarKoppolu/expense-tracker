function lastMonths(count) {
  const months = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleString(undefined, { month: "long", year: "numeric" });
    months.push({ value, label });
  }
  return months;
}

export default function MonthSelector({ selectedMonths, onChange }) {
  const options = lastMonths(12);

  function toggle(value) {
    if (selectedMonths.includes(value)) {
      onChange(selectedMonths.filter((m) => m !== value));
    } else {
      onChange([...selectedMonths, value]);
    }
  }

  return (
    <div className="chip-group">
      {options.map((m) => (
        <button
          type="button"
          key={m.value}
          className={`chip ${selectedMonths.includes(m.value) ? "chip-active" : ""}`}
          onClick={() => toggle(m.value)}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
