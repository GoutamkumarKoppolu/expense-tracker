import { splitCurrency } from "../../utils/format";

// Large display amount with de-emphasised paise, e.g. ₹87,457.85
export default function Money({ value, className = "" }) {
  const { whole, fraction } = splitCurrency(value);
  return (
    <span className={`money ${className}`}>
      {whole}
      <span className="money-fraction">{fraction}</span>
    </span>
  );
}
