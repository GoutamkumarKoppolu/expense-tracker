import { useEffect, useState, useCallback } from "react";
import "./App.css";
import TransactionForm from "./components/TransactionForm";
import TransactionList from "./components/TransactionList";
import SummaryPanel from "./components/SummaryPanel";
import YearMonthSelector from "./components/YearMonthSelector";
import TagFilter from "./components/TagFilter";
import KindFilter from "./components/KindFilter";
import SettingsPage from "./components/SettingsPage";
import CreditCardsPage from "./components/CreditCardsPage";
import { SavingsPage } from "./features/savings";
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
import { currentMonth } from "./utils/format";
import { DEDUCTION_FILTERS } from "./domain/transactions";

// Top-level pages, in nav order. Add a new page here rather than branching in JSX.
const VIEWS = [
  { id: "main", label: "Tracker" },
  { id: "savings", label: "Savings" },
  { id: "cards", label: "Credit Cards" },
  { id: "settings", label: "Manage options" },
];

const emptyOptions = { "transaction-types": [], "payment-methods": [], "payment-sources": [] };
const emptyOverview = { totalEarnings: 0, totalExpenses: 0, totalSavings: 0, balance: 0 };

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [options, setOptions] = useState(emptyOptions);
  const [overview, setOverview] = useState(emptyOverview);
  const [selectedMonths, setSelectedMonths] = useState([currentMonth()]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [kindFilter, setKindFilter] = useState({ kind: "", deduction: DEDUCTION_FILTERS.ALL });
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
    fetchTransactions({ months: selectedMonths, tags: selectedTags, ...kindFilter })
      .then(setTransactions)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [selectedMonths, selectedTags, kindFilter]);

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

  // Other pages (e.g. Savings) can change ledger-derived figures, so reload
  // them whenever the Tracker is opened again.
  function openView(id) {
    if (id === "main" && view !== "main") refreshAfterMutation();
    setView(id);
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

  const otherPages = {
    savings: <SavingsPage />,
    cards: <CreditCardsPage />,
    settings: (
      <SettingsPage
        options={options}
        onAdd={handleAddOption}
        onDelete={handleDeleteOption}
        onBack={() => openView("main")}
      />
    ),
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Expense Tracker</h1>
        <nav className="app-nav">
          {VIEWS.map((v) => (
            <button
              type="button"
              key={v.id}
              className={view === v.id ? "" : "secondary"}
              onClick={() => openView(v.id)}
            >
              {v.label}
            </button>
          ))}
        </nav>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {view === "main" ? (
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
            <YearMonthSelector selectedMonths={selectedMonths} onChange={setSelectedMonths} />

            <h2>Filter by tag</h2>
            <TagFilter availableTags={availableTags} selectedTags={selectedTags} onChange={setSelectedTags} />

            <h2>Filter by type</h2>
            <KindFilter kind={kindFilter.kind} deduction={kindFilter.deduction} onChange={setKindFilter} />
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
      ) : (
        otherPages[view]
      )}
    </div>
  );
}
