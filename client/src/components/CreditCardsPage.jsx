import { useCallback, useEffect, useState } from "react";
import YearMonthSelector from "./YearMonthSelector";
import CardUtilizationChart from "./CardUtilizationChart";
import {
  fetchCreditCards,
  createCreditCard,
  deleteCreditCard,
  fetchCardTransactions,
  createCardTransaction,
  deleteCardTransaction,
  fetchCardUtilization,
} from "../api";

const currency = (n) => `₹${Number(n).toFixed(2)}`;
const today = () => new Date().toISOString().slice(0, 10);

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

function AddCardForm({ onAdd }) {
  const [name, setName] = useState("");
  const [last4, setLast4] = useState("");

  function handleSubmit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({ name: name.trim(), last4: last4 || undefined });
    setName("");
    setLast4("");
  }

  return (
    <form className="field-row" onSubmit={handleSubmit}>
      <label>
        Card name
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. HDFC Regalia"
          required
        />
      </label>
      <label>
        Last 4 digits (optional)
        <input
          type="text"
          inputMode="numeric"
          value={last4}
          onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
          placeholder="1234"
        />
      </label>
      <div className="field-row actions">
        <button type="submit">Add card</button>
      </div>
    </form>
  );
}

function AddCardTransactionForm({ onAdd }) {
  const [form, setForm] = useState({ amount: "", description: "", date: today() });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    onAdd({ ...form, amount: Number(form.amount) });
    setForm({ amount: "", description: "", date: today() });
  }

  return (
    <form className="field-row" onSubmit={handleSubmit}>
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
      <label className="grow">
        Description
        <input
          type="text"
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="e.g. Amazon order"
          required
        />
      </label>
      <label>
        Date
        <input type="date" name="date" value={form.date} onChange={handleChange} required />
      </label>
      <div className="field-row actions">
        <button type="submit">Add transaction</button>
      </div>
    </form>
  );
}

function CardSection({ card, months, onAddTransaction, onDeleteTransaction, onDeleteCard }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    fetchCardTransactions(card.id, { months })
      .then(setTransactions)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [card.id, months]);

  useEffect(() => {
    load();
  }, [load]);

  const total = transactions.reduce((sum, t) => sum + Number(t.amount), 0);

  async function handleAdd(data) {
    try {
      setError("");
      await onAddTransaction(card.id, data);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleDelete(txId) {
    try {
      setError("");
      await onDeleteTransaction(card.id, txId);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <section className="card">
      <div className="settings-header">
        <h2>
          {card.name}
          {card.last4 && <span className="cc-last4"> •••• {card.last4}</span>}
        </h2>
        <div className="cc-card-actions">
          <span className="stat-value negative">{currency(total)}</span>
          <button type="button" className="link-btn danger" onClick={() => onDeleteCard(card.id)}>
            Remove card
          </button>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <AddCardTransactionForm onAdd={handleAdd} />

      {loading ? (
        <p>Loading…</p>
      ) : transactions.length ? (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th className="amount-col">Amount</th>
              <th className="row-actions"></th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id}>
                <td>{t.date.slice(0, 10)}</td>
                <td>{t.description}</td>
                <td className="amount-col">{currency(t.amount)}</td>
                <td className="row-actions">
                  <button type="button" className="link-btn danger" onClick={() => handleDelete(t.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="empty-state">No transactions logged for this selection.</p>
      )}
    </section>
  );
}

export default function CreditCardsPage() {
  const [cards, setCards] = useState([]);
  const [utilization, setUtilization] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([currentMonth()]);
  const [error, setError] = useState("");

  const loadCards = useCallback(() => {
    fetchCreditCards().then(setCards).catch((e) => setError(e.message));
  }, []);

  const loadUtilization = useCallback(() => {
    fetchCardUtilization().then(setUtilization).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    loadCards();
    loadUtilization();
  }, [loadCards, loadUtilization]);

  async function handleAddCard(data) {
    try {
      setError("");
      await createCreditCard(data);
      loadCards();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleDeleteCard(id) {
    if (!window.confirm("Remove this card and all of its logged transactions?")) return;
    try {
      setError("");
      await deleteCreditCard(id);
      loadCards();
      loadUtilization();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleAddTransaction(cardId, data) {
    await createCardTransaction(cardId, data);
    loadUtilization();
  }

  async function handleDeleteTransaction(cardId, txId) {
    await deleteCardTransaction(cardId, txId);
    loadUtilization();
  }

  return (
    <div>
      {error && <div className="error-banner">{error}</div>}

      <section className="card">
        <h2>Add a credit card</h2>
        <AddCardForm onAdd={handleAddCard} />
      </section>

      {cards.length > 0 && (
        <section className="card">
          <h2>Months</h2>
          <YearMonthSelector selectedMonths={selectedMonths} onChange={setSelectedMonths} />
        </section>
      )}

      {cards.length === 0 ? (
        <section className="card">
          <p className="empty-state">No credit cards added yet. Add one above to start tracking.</p>
        </section>
      ) : (
        cards.map((card) => (
          <CardSection
            key={card.id}
            card={card}
            months={selectedMonths}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onDeleteCard={handleDeleteCard}
          />
        ))
      )}

      <section className="card">
        <h2>Monthly card utilization</h2>
        <CardUtilizationChart cards={cards} utilization={utilization} />
      </section>
    </div>
  );
}
