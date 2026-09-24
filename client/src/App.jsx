import { useState } from "react";
import { ChartPie, House, LayoutGrid, PiggyBank } from "lucide-react";
import "./App.css";
import BottomNav from "./app/BottomNav";
import { useHashRoute } from "./app/useHashRoute";
import { useSystemBars } from "./app/useSystemBars";
import { LedgerProvider, TransactionSheet } from "./features/ledger";
import HomePage from "./features/home/HomePage";
import ReportPage from "./features/report/ReportPage";
import { SavingsPage } from "./features/savings";
import CreditCardsPage from "./features/cards/CreditCardsPage";
import SettingsPage from "./features/settings/SettingsPage";
import MorePage from "./features/settings/MorePage";
import AppearancePage from "./features/appearance/AppearancePage";
import TagsPage from "./features/tags/TagsPage";

// Page registry. `tab` is the bottom-nav tab that stays highlighted; `add`
// shows the + (add transaction) button; `hero` means the page starts with
// the colored balance header (status bar is tinted to match). Add a page
// here, nowhere else.
const ROUTES = {
  home: { page: HomePage, tab: "home", add: true, hero: true },
  report: { page: ReportPage, tab: "report", add: true },
  savings: { page: SavingsPage, tab: "savings", add: true },
  more: { page: MorePage, tab: "more" },
  tags: { page: TagsPage, tab: "more", add: true },
  cards: { page: CreditCardsPage, tab: "more" },
  settings: { page: SettingsPage, tab: "more" },
  appearance: { page: AppearancePage, tab: "more" },
};

const TABS = [
  { id: "home", label: "Home", icon: House },
  { id: "report", label: "Report", icon: ChartPie },
  { id: "savings", label: "Savings", icon: PiggyBank },
  { id: "more", label: "More", icon: LayoutGrid },
];

export default function App() {
  const [route, navigate] = useHashRoute(ROUTES, "home");
  // null = closed, { transaction: null } = add, { transaction } = edit
  const [sheet, setSheet] = useState(null);
  const { page: Page, tab, add, hero = false } = ROUTES[route];
  useSystemBars(hero);

  return (
    <LedgerProvider>
      <div className="app">
        <main className="app-main">
          <Page navigate={navigate} onOpenTransaction={(transaction) => setSheet({ transaction })} />
        </main>
        <BottomNav
          tabs={TABS}
          activeTab={tab}
          onNavigate={navigate}
          onAdd={add ? () => setSheet({ transaction: null }) : null}
        />
        {sheet && <TransactionSheet transaction={sheet.transaction} onClose={() => setSheet(null)} />}
      </div>
    </LedgerProvider>
  );
}
