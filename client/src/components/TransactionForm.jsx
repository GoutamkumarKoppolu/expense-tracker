import { useEffect, useState } from "react";

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = {
  type: "",
  amount: "",
  tag: "",
  payment_method: "",
  payment_source: "",
  date: today(),
  note: "",
};

export default function TransactionForm({
  existingTags,
  transactionTypes,
  paymentMethods,
  paymentSources,
  editingTransaction,
  onSubmit,
  onCancelEdit,
}) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (editingTransaction) {
      setForm({
        type: editingTransaction.type,
        amount: editingTransaction.amount,
        tag: editingTransaction.tag,
        payment_method: editingTransaction.payment_method || "",
        payment_source: editingTransaction.payment_source || "",
        date: editingTransaction.date.slice(0, 10),
        note: editingTransaction.note || "",
      });
    } else {
      setForm(emptyForm);
    }
  }, [editingTransaction]);

  // Default to "expense" (the most common entry) once types have loaded,
  // falling back to whatever's first if "expense" isn't among them.
  useEffect(() => {
    if (!editingTransaction && !form.type && transactionTypes.length) {
      const defaultType = transactionTypes.find((t) => t.name === "expense") || transactionTypes[0];
      setForm((f) => ({ ...f, type: defaultType.name }));
    }
  }, [transactionTypes, editingTransaction, form.type]);

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
          <select name="type" value={form.type} onChange={handleChange} required>
            <option value="" disabled>
              Select type
            </option>
            {transactionTypes.map((t) => (
              <option key={t.id} value={t.name}>
                {t.name}
              </option>
            ))}
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

      <div className="field-row">
        <label>
          Payment Method (optional)
          <select name="payment_method" value={form.payment_method} onChange={handleChange}>
            <option value="">— none —</option>
            {paymentMethods.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Payment Source (optional)
          <select name="payment_source" value={form.payment_source} onChange={handleChange}>
            <option value="">— none —</option>
            {paymentSources.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
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
