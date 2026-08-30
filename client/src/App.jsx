import { useEffect, useState, useCallback } from "react";
import "./App.css";
import TransactionForm from "./components/TransactionForm";
import TransactionList from "./components/TransactionList";
import SummaryPanel from "./components/SummaryPanel";
import MonthSelector from "./components/MonthSelector";
import TagFilter from "./components/TagFilter";
import { fetchTransactions, fetchTags, createTransaction, updateTransaction, deleteTransaction } from "./api";

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedMonths, setSelectedMonths] = useState([currentMonth()]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadTags = useCallback(() => {
    fetchTags().then(setAvailableTags).catch((e) => setError(e.message));
  }, []);

  const loadTransactions = useCallback(() => {
    setLoading(true);
    fetchTransactions({ months: selectedMonths, tags: selectedTags })
      .then(setTransactions)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedMonths, selectedTags]);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  async function handleSubmit(data) {
    try {
      setError("");
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, data);
        setEditingTransaction(null);
      } else {
        await createTransaction(data);
      }
      loadTransactions();
      loadTags();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleDelete(id) {
    try {
      setError("");
      await deleteTransaction(id);
      loadTransactions();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="app">
      <header>
        <h1>Expense Tracker</h1>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <section className="card">
        <h2>{editingTransaction ? "Edit transaction" : "Add transaction"}</h2>
        <TransactionForm
          existingTags={availableTags}
          editingTransaction={editingTransaction}
          onSubmit={handleSubmit}
          onCancelEdit={() => setEditingTransaction(null)}
        />
      </section>

      <section className="card">
        <h2>Months</h2>
        <MonthSelector selectedMonths={selectedMonths} onChange={setSelectedMonths} />

        <h2>Filter by tag</h2>
        <TagFilter availableTags={availableTags} selectedTags={selectedTags} onChange={setSelectedTags} />
      </section>

      <section className="card">
        <h2>Summary</h2>
        {loading ? <p>Loading…</p> : <SummaryPanel transactions={transactions} />}
      </section>

      <section className="card">
        <h2>Transactions</h2>
        {loading ? (
          <p>Loading…</p>
        ) : (
          <TransactionList
            transactions={transactions}
            onEdit={setEditingTransaction}
            onDelete={handleDelete}
          />
        )}
      </section>
    </div>
  );
}
