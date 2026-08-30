import { useEffect, useState } from "react";

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = {
  type: "expense",
  amount: "",
  tag: "",
  date: today(),
  note: "",
};

export default function TransactionForm({ existingTags, editingTransaction, onSubmit, onCancelEdit }) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (editingTransaction) {
      setForm({
        type: editingTransaction.type,
        amount: editingTransaction.amount,
        tag: editingTransaction.tag,
        date: editingTransaction.date.slice(0, 10),
        note: editingTransaction.note || "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [editingTransaction]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({ ...form, amount: Number(form.amount) });
    if (!editingTransaction) setForm(emptyForm);
  }

  return (
    <form className="transaction-form" onSubmit={handleSubmit}>
      <div className="field-row">
        <label>
          Type
          <select name="type" value={form.type} onChange={handleChange}>
            <option value="expense">Expense</option>
            <option value="earning">Earning</option>
          </select>
        </label>

        <label>
          Amount
          <input
            type="number"
            name="amount"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={handleChange}
            required
          />
        </label>

        <label>
          Date
          <input type="date" name="date" value={form.date} onChange={handleChange} required />
        </label>
      </div>

      <div className="field-row">
        <label>
          Tag / Category
          <input
            type="text"
            name="tag"
            list="tag-options"
            placeholder="e.g. Shopping, Salary, Food"
            value={form.tag}
            onChange={handleChange}
            required
          />
          <datalist id="tag-options">
            {existingTags.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </label>

        <label className="grow">
          Note (optional)
          <input type="text" name="note" value={form.note} onChange={handleChange} />
        </label>
      </div>

      <div className="field-row actions">
        <button type="submit">{editingTransaction ? "Save changes" : "Add transaction"}</button>
        {editingTransaction && (
          <button type="button" className="secondary" onClick={onCancelEdit}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
