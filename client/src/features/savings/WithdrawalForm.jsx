import { useState } from "react";
import { currency, today } from "../../utils/format";

const emptyForm = () => ({ tag: "", amount: "", date: today(), note: "" });

// Records money taken out of a savings pot. Only pots with money left are offered.
export default function WithdrawalForm({ pots, onSubmit }) {
  const [form, setForm] = useState(emptyForm);
  const available = pots.filter((p) => p.remaining > 0);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (await onSubmit({ ...form, amount: Number(form.amount) })) setForm(emptyForm());
  }

  if (!available.length) {
    return <p className="empty-state">No savings available to use.</p>;
  }

  return (
    <form className="transaction-form" onSubmit={handleSubmit}>
      <div className="field-row">
        <label>
          From pot
          <select name="tag" value={form.tag} onChange={handleChange} required>
            <option value="" disabled>
              Select pot
            </option>
            {available.map((p) => (
              <option key={p.tag} value={p.tag}>
                {p.tag} ({currency(p.remaining)} left)
              </option>
            ))}
          </select>
        </label>

        <label>
          Amount
          <input type="number" name="amount" min="0.01" step="0.01" value={form.amount} onChange={handleChange} required />
        </label>

        <label>
          Date
          <input type="date" name="date" value={form.date} onChange={handleChange} required />
        </label>

        <label className="grow">
          What for? (optional)
          <input type="text" name="note" value={form.note} onChange={handleChange} placeholder="e.g. Laptop repair" />
        </label>
      </div>

      <div className="field-row actions">
        <button type="submit">Use savings</button>
      </div>
    </form>
  );
}
