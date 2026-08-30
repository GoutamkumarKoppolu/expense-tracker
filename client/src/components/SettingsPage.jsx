import { useState } from "react";

const KIND_LABELS = { earning: "Earning", expense: "Expense", saving: "Saving" };

function TransactionTypeList({ options, onAdd, onDelete }) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState("expense");

  function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd("transaction-types", { name: name.trim(), kind });
    setName("");
  }

  return (
    <div className="option-list">
      <h3>Transaction Types</h3>
      <ul>
        {options.map((o) => (
          <li key={o.id}>
            <span>
              {o.name} <span className={`kind-badge kind-${o.kind}`}>{KIND_LABELS[o.kind] || o.kind}</span>
            </span>
            <button
              type="button"
              className="link-btn danger"
              onClick={() => onDelete("transaction-types", o.id)}
            >
              Remove
            </button>
          </li>
        ))}
        {!options.length && <li className="empty-state">No options yet.</li>}
      </ul>
      <form className="option-add-form" onSubmit={handleAdd}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add transaction type"
        />
        <select value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="earning">Earning</option>
          <option value="expense">Expense</option>
          <option value="saving">Saving</option>
        </select>
        <button type="submit">Add</button>
      </form>
    </div>
  );
}

function OptionList({ title, kind, options, onAdd, onDelete }) {
  const [name, setName] = useState("");

  function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd(kind, name.trim());
    setName("");
  }

  return (
    <div className="option-list">
      <h3>{title}</h3>
      <ul>
        {options.map((o) => (
          <li key={o.id}>
            <span>{o.name}</span>
            <button type="button" className="link-btn danger" onClick={() => onDelete(kind, o.id)}>
              Remove
            </button>
          </li>
        ))}
        {!options.length && <li className="empty-state">No options yet.</li>}
      </ul>
      <form className="option-add-form" onSubmit={handleAdd}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={`Add ${title.toLowerCase()}`}
        />
        <button type="submit">Add</button>
      </form>
    </div>
  );
}

export default function SettingsPage({ options, onAdd, onDelete, onBack }) {
  return (
    <div className="card">
      <div className="settings-header">
        <h2>Manage options</h2>
        <button type="button" className="secondary" onClick={onBack}>
          Back to tracker
        </button>
      </div>

      <TransactionTypeList options={options["transaction-types"]} onAdd={onAdd} onDelete={onDelete} />
      <OptionList
        title="Payment Methods"
        kind="payment-methods"
        options={options["payment-methods"]}
        onAdd={onAdd}
        onDelete={onDelete}
      />
      <OptionList
        title="Payment Sources"
        kind="payment-sources"
        options={options["payment-sources"]}
        onAdd={onAdd}
        onDelete={onDelete}
      />
    </div>
  );
}
