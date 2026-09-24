import { Plus } from "lucide-react";

// One UI style bottom navigation: tabs in thumb reach, with the primary
// "add" action as a raised button in the middle.
export default function BottomNav({ tabs, activeTab, onNavigate, onAdd }) {
  const middle = Math.ceil(tabs.length / 2);

  const renderTab = (tab) => {
    const Icon = tab.icon;
    const active = tab.id === activeTab;
    return (
      <button
        type="button"
        key={tab.id}
        className={`nav-tab ${active ? "is-active" : ""}`}
        aria-current={active ? "page" : undefined}
        onClick={() => onNavigate(tab.id)}
      >
        <Icon size={22} strokeWidth={active ? 2.4 : 2} />
        <span>{tab.label}</span>
      </button>
    );
  };

  return (
    <nav className="bottom-nav" aria-label="Main">
      {tabs.slice(0, middle).map(renderTab)}
      <div className="nav-fab-slot">
        {onAdd && (
          <button type="button" className="nav-fab" onClick={onAdd} aria-label="Add transaction">
            <Plus size={26} strokeWidth={2.4} />
          </button>
        )}
      </div>
      {tabs.slice(middle).map(renderTab)}
    </nav>
  );
}
