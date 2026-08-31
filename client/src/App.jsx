import { useEffect, useState, useCallback } from "react";
import "./App.css";
import TransactionForm from "./components/TransactionForm";
import TransactionList from "./components/TransactionList";
import SummaryPanel from "./components/SummaryPanel";
import MonthSelector from "./components/MonthSelector";
import TagFilter from "./components/TagFilter";
import SettingsPage from "./components/SettingsPage";
import {
  fetchTransactions,
  fetchTags,
  fetchAllOptions,
  fetchOverview,
  addOption,
  deleteOption,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from "./api";

const currentMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const emptyOptions = { "transaction-types": [], "payment-methods": [], "payment-sources": [] };
const emptyOverview = { totalEarnings: 0, totalExpenses: 0, totalSavings: 0, balance: 0 };

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [options, setOptions] = useState(emptyOptions);
  const [overview, setOverview] = useState(emptyOverview);
  const [selectedMonths, setSelectedMonths] = useState([currentMonth()]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [view, setView] = useState("main");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadTags = useCallback(() => {
    fetchTags().then(setAvailableTags).catch((e) => setError(e.message));
  }, []);

  const loadOptions = useCallback(() => {
    fetchAllOptions().then(setOptions).catch((e) => setError(e.message));
  }, []);

  const loadOverview = useCallback(() => {
    fetchOverview().then(setOverview).catch((e) => setError(e.message));
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
    loadOptions();
    loadOverview();
  }, [loadTags, loadOptions, loadOverview]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  function refreshAfterMutation() {
    loadTransactions();
    loadTags();
    loadOverview();
  }

  async function handleSubmit(data) {
    try {
      setError("");
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, data);
        setEditingTransaction(null);
      } else {
        await createTransaction(data);
      }
      refreshAfterMutation();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleDelete(id) {
    try {
      setError("");
      await deleteTransaction(id);
      refreshAfterMutation();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleAddOption(kind, payload) {
    try {
      setError("");
      await addOption(kind, payload);
      loadOptions();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleDeleteOption(kind, id) {
    try {
      setError("");
      await deleteOption(kind, id);
      loadOptions();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Expense Tracker</h1>
        <button type="button" className="secondary" onClick={() => setView(view === "main" ? "settings" : "main")}>
          {view === "main" ? "Manage options" : "Back to tracker"}
        </button>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {view === "settings" ? (
        <SettingsPage
          options={options}
          onAdd={handleAddOption}
          onDelete={handleDeleteOption}
          onBack={() => setView("main")}
        />
      ) : (
        <>
          <section className="card">
            <h2>{editingTransaction ? "Edit transaction" : "Add transaction"}</h2>
            <TransactionForm
              existingTags={availableTags}
              transactionTypes={options["transaction-types"]}
              paymentMethods={options["payment-methods"]}
              paymentSources={options["payment-sources"]}
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
            {loading ? <p>Loading…</p> : <SummaryPanel transactions={transactions} overview={overview} />}
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
        </>
      )}
    </div>
  );
}
