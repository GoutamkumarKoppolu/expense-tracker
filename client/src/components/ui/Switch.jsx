// One UI style toggle row: label (+ optional description) with a switch.
export default function Switch({ checked, onChange, label, description, name }) {
  return (
    <label className="switch-row">
      <span className="switch-text">
        <span className="switch-label">{label}</span>
        {description && <span className="switch-desc">{description}</span>}
      </span>
      <input
        type="checkbox"
        role="switch"
        name={name}
        className="switch-input"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="switch-track" aria-hidden="true" />
    </label>
  );
}
