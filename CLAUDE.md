# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this project is

A personal expense tracker that runs **fully offline, on-device**. It's a React (Vite) single-page app that stores everything in IndexedDB via Dexie, and it's also packaged as an Android app with Capacitor. There is **no backend in use**. `server/` is a legacy Express + Postgres API kept only for reference. Don't add features to it or make the client depend on it.

Stack: React 19, Vite 8, Dexie 4, Capacitor 7 (Android), oxlint. Plain JavaScript/JSX (no TypeScript), plain CSS (no UI framework, no router, no state library). There is no test suite yet.

## Running locally

All day-to-day work happens in `client/`:

```bash
cd client
npm install
npm run dev        # http://localhost:5173 (creates and seeds the IndexedDB "expense-tracker" DB on first load)
npm run lint       # oxlint
npm run build      # production build -> client/dist
npm run preview    # serve the production build
```

No `.env`, database, or server is needed. To reset local data, delete the `expense-tracker` IndexedDB database in the browser's DevTools (Application → IndexedDB). It will be re-seeded on the next load.

**Android:**
- CI: GitHub → Actions → "Build Android APK" → Run workflow (manual `workflow_dispatch`, [.github/workflows/android-build.yml](.github/workflows/android-build.yml)). Download the `app-debug-apk` artifact. It uses Node 20 and JDK 21, and the build is an unsigned debug build.
- Local (needs Android Studio): `cd client && npm run cap:sync && npx cap open android`.
- `client/android/` is Capacitor-generated. Commit it as-is and avoid hand-editing it unless a native change is really required.

**Legacy server (optional, not used by the app):** see README. `cd server && cp .env.example .env && npm install && npm start` against a Postgres DB created from `server/schema.sql`.

## Architecture

```
client/src/
  main.jsx               React root
  App.jsx                Top-level state, view switching ("main" | "cards" | "settings"), data loading, mutation handlers
  api.js                 Data-access/service layer: every read/write goes through here (async functions over Dexie)
  db/
    schema.js            Dexie store definitions (STORES)
    index.js             Dexie instance, versioning, populate -> seed, storage.persist()
    seed.js              Default transaction types / payment methods / payment sources
    validators.js        Pure validation helpers (throw Error with user-facing messages)
  components/            Presentational + page components
  index.css              Theme tokens (CSS variables, light/dark via prefers-color-scheme)
  App.css                Component styles, safe-area padding for Android status bar
```

**Data flow:** Component → handler in `App.jsx` (or page component) → `api.js` function → Dexie (`db`). Errors are thrown as `Error(message)` and shown via `setError(e.message)` in an error banner. After a mutation, the caller reloads the affected data (`refreshAfterMutation()` in App.jsx).

**Data model (IndexedDB stores):**
| Store | Fields |
|---|---|
| `transaction_types` | `id`, `name` (unique), `kind` (`earning` \| `expense` \| `saving`) |
| `payment_methods` | `id`, `name` (unique) |
| `payment_sources` | `id`, `name` (unique) |
| `transactions` | `id`, `type` (type *name*), `amount`, `tag`, `payment_method`, `payment_source`, `date`, `note`, `created_at` |
| `credit_cards` | `id`, `name`, `last4`, `created_at` |
| `credit_card_transactions` | `id`, `card_id`, `amount`, `description`, `date`, `created_at` |

Conventions in the data layer:
- Dates are stored as **strings** (`date` = `"YYYY-MM-DD"`, `created_at` = ISO). Month keys are `date.slice(0, 7)` (`"YYYY-MM"`). Never store `Date` objects.
- Transactions reference their type by **name**. `api.js` derives `type_kind` at read time, and all totals are computed from `type_kind`, not the type name.
- There are no foreign keys in IndexedDB, so cascades are done manually inside a Dexie transaction (see `deleteCreditCard`).
- Option CRUD is generic over the `OPTION_KINDS` / `TABLE_BY_KIND` maps in `api.js`.

## Features / components

| Feature | Where |
|---|---|
| Add/edit/delete transactions (type, amount, tag, date, note, payment method, payment source) | `TransactionForm.jsx`, `TransactionList.jsx`, `App.jsx` handlers |
| Year × month multi-select filter (reusable `MultiSelectDropdown`, `useClickOutside`) | `YearMonthSelector.jsx` |
| Tag filter | `TagFilter.jsx` |
| Summary: earnings, expenses, savings for the selection, plus all-time savings and balance | `SummaryPanel.jsx` (overview from `fetchOverview`) |
| Spending-by-tag bar chart and table | `SpendingChart.jsx`, `SummaryPanel.jsx` |
| Credit cards: add/delete cards, per-card transactions (separate from the main ledger), month filter | `CreditCardsPage.jsx` (owns its own state and data loading) |
| Monthly card utilization chart (last 6 months, fixed colorblind-safe palette `--cat-1..8`) | `CardUtilizationChart.jsx` |
| Manage options: transaction types (with kind), payment methods, payment sources | `SettingsPage.jsx` |
| Offline storage and Android packaging | `db/`, `capacitor.config.json`, `client/android/` |

## How extensible the code is today

**Easy to extend:**
- New data access: add a function to `api.js`, and components never touch Dexie directly.
- New option lists: add an entry to `OPTION_KINDS` / `TABLE_BY_KIND` / `NOT_FOUND_MESSAGE` plus a store and a seed.
- New validation: add pure helpers to `db/validators.js`.
- New pages: `CreditCardsPage` is the model for a self-contained feature page that owns its state and data loading.
- Theming: all colors are CSS variables in `index.css`.

**Friction points to be aware of (improve them when you touch them, don't spread them):**
- `App.jsx` holds all main-ledger state and handlers, and views are switched with a chained ternary. Adding pages there makes it grow.
- `api.js` is one file covering transactions, options, and credit cards.
- Helpers are duplicated across files: `currency` (5 files), `currentMonth` (2), `today` (2).
- `today()` uses `toISOString()` (UTC), so in IST before 05:30 it returns yesterday's date.
- Filtering loads whole tables and filters in memory. That's fine at personal scale, but use Dexie indexes if data grows.
- Schema changes need a **new `db.version(n)`**, not an edit to version 1. Editing v1 breaks existing installs, including users' phones.
- No tests.

## Rules for building new features

Every new feature must be **decoupled** so it can be added, changed, or removed without breaking existing features. Follow these rules:

1. **Feature isolation.** Put a new feature in its own module: `src/features/<feature>/` with its page/components, its own data functions (e.g. `features/<feature>/api.js`), and any feature-specific helpers. A feature should be removable by deleting its folder and its one registration line.
2. **Layering: UI → service → storage.** Components never import `db` or Dexie. All persistence goes through service functions (`api.js` or the feature's own api module), which return plain objects and throw `Error` with user-facing messages. Keep business logic (totals, grouping, validation) in pure functions outside components so it can be tested and reused.
3. **Single responsibility.** One component does one thing. Split pages into container (state + data loading) and presentational components (props in, JSX out), the way `CreditCardsPage` → `CardUtilizationChart` does. Keep files small and focused.
4. **Open/closed: extend, don't modify.** Prefer config maps and registries (like `OPTION_KINDS` / `TABLE_BY_KIND`) over new `if/else` or ternary branches. New top-level pages should be registered in a single view/nav registry (introduce one in `App.jsx` when adding the next page) instead of adding another branch to the ternary.
5. **Don't touch unrelated features.** A new feature must not change the behavior, props, or data shape of existing features. If a shared contract (an `api.js` signature, a store shape, a component's props) must change, keep it backward-compatible and update every caller in the same change.
6. **DRY with shared utilities.** Reusable helpers (currency formatting, date/month helpers, `MultiSelectDropdown`, `useClickOutside`) belong in shared modules (`src/utils/`, `src/components/common/`, `src/hooks/`). Don't copy-paste them. When you touch a file that has a duplicated helper, move it to the shared module.
7. **Safe schema evolution.** Add stores and indexes via a new `db.version(n).stores({...})` (with `.upgrade()` for data migrations). Never edit an existing version, never drop user data, and keep old data readable.
8. **Keep the offline, no-backend model.** No network calls, no server dependency, no new heavy dependencies without a clear need. Everything must work inside the Android WebView.
9. **Follow existing conventions.** Use string dates, `type_kind` for totals, errors surfaced via `setError(e.message)`, colors from CSS variables (support both light and dark), respect the safe-area padding, and match the existing JSX/CSS style.
10. **Verify before finishing.** Run `npm run lint` and `npm run build` in `client/`, then exercise the feature in `npm run dev`, including regressions in the Tracker, Credit Cards, and Manage options views. If you add pure logic, add tests for it (introduce Vitest if it isn't set up yet).
