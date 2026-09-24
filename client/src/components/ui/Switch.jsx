// One UI style toggle row: label (+ optional description) with a switch.
import { useId } from "react";
import InfoButton from "./InfoButton";

// `info` is an optional HELP topic shown as an ⓘ after the label.
export default function Switch({ checked, onChange, label, description, name, info }) {
  // Explicit htmlFor: without it a tap on the row would activate the label's
  // first control, which is the ⓘ button when `info` is set.
  const inputId = useId();
  return (
    <label className="switch-row" htmlFor={inputId}>
      <span className="switch-text">
        <span className="switch-label">
          {label}
          {info && <InfoButton topic={info} />}
        </span>
        {description && <span className="switch-desc">{description}</span>}
      </span>
      <input
        id={inputId}
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
