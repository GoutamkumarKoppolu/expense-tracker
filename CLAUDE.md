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
- **Status bar / navigation bar (Android 15+ edge-to-edge):** `capacitor.config.json` sets `android.adjustMarginsForEdgeToEdge: "auto"`, so Android insets the WebView below the status bar and above the nav bar natively (don't rely on `env(safe-area-inset-*)`, which older Android WebViews report as 0). The strips behind the bars are coloured by the local `SystemBarsPlugin.java` (registered in `MainActivity`), driven from `app/useSystemBars.js`: hero colour on pages with `hero: true` in `ROUTES`, page background elsewhere, bottom nav colour at the bottom, with icons light/dark to stay readable. Keep the CSS `env(safe-area-inset-*)` padding too, for iOS and browsers.

**Legacy server (optional, not used by the app):** see README. `cd server && cp .env.example .env && npm install && npm start` against a Postgres DB created from `server/schema.sql`.

## Architecture

```
client/src/
  main.jsx                 React root
  App.jsx                  Shell only: ROUTES page registry, bottom nav, global add/edit transaction sheet
  app/
    useHashRoute.js        Hash router (#/savings). Real history entries, so the Android back button works
    BottomNav.jsx          One UI bottom tabs with the raised centre + button
  api.js                   Core ledger data access: transactions, options, overview, registerTransactionGuard
  domain/transactions.js   Pure ledger rules: kinds, balance-deduction flag, computeTotals, matchesFilters
  utils/format.js          Shared helpers: currency, compactCurrency (₹12.35L), dates, periodLabel, groupByDate
  components/
    ui/                    Design-system primitives: BottomSheet, PageHeader (collapsing large title),
                           SegmentedControl, ChipGroup, Switch, StatCard, ProgressRing, DonutChart,
                           Money, ListRow, EmptyState, ErrorBanner, InfoButton (ⓘ → help sheet)
    MonthPicker.jsx        Years × months chip picker ("YYYY-MM"[] contract)
    PeriodSheet.jsx        MonthPicker in a bottom sheet
  features/
    ledger/                Shared ledger state (LedgerProvider + useLedger), TransactionForm/Sheet/List, kindMeta
    home/                  Home page: balance hero, "Your money" cards, FilterSheet, transaction list
    report/                Report page: per-tag donut + breakdown, change vs previous month (pure rules in domain.js)
    savings/               Savings page: pots, withdrawals, history (api.js, domain.js, index.js registers its guard)
    cards/                 Credit cards page + utilization chart (own api.js; separate from the ledger)
    settings/              Manage options page + More page
    appearance/            Appearance page: background + accent pickers with live preview
    tags/                  Tags page: all transactions by kind → tag → month, all time by default (pure rules in domain.js)
    backup/                Backup & restore: backupFormat.js (format version, per-table specs, migrations, validation),
                           api.js (export all tables / restore in one transaction), fileio.js (download vs Android share sheet)
  content/help.js          In-app explanations shown by InfoButton (one entry per topic)
  theme/
    palettes.css           Accent palettes (light + dark variants) and the Black background
    palettes.js            BACKGROUNDS / ACCENTS option lists (ids match palettes.css)
    themeStore.js          Saves the choice in localStorage; sets data-theme / data-accent / data-bg on <html>
    useTheme.js            React hook over the store
  db/
    schema.js              Dexie store definitions (STORES = v1, STORES_V2 = v2 additions)
    index.js               Dexie instance, versioning, populate -> seed, storage.persist()
    seed.js                Default transaction types / payment methods / payment sources
    validators.js          Pure validation helpers (throw Error with user-facing messages)
  index.css                Base design tokens (neutrals, semantic colors, radii, shadows) for light + dark, base element styles
  App.css                  All component/page styles, grouped by section
```

**Data flow:** Page → `useLedger()` action (e.g. `saveTransaction`) or the feature's own `api.js` → Dexie (`db`). Service functions throw `Error(message)`. The ledger context and each feature page catch it and show it in an `ErrorBanner` (inside the open sheet when there is one). Ledger mutations call `refresh()`, and pages with their own queries (Report, Savings) reload when `useLedger().transactions` changes.

**Data model (IndexedDB stores):**
| Store | Fields |
|---|---|
| `transaction_types` | `id`, `name` (unique), `kind` (`earning` \| `expense` \| `saving`) |
| `payment_methods` | `id`, `name` (unique) |
| `payment_sources` | `id`, `name` (unique) |
| `transactions` | `id`, `type` (type *name*), `amount`, `tag`, `payment_method`, `payment_source`, `date`, `note`, `deduct_from_balance` (savings only; `null` otherwise, missing = `true`), `created_at` |
| `credit_cards` | `id`, `name`, `last4`, `created_at` |
| `credit_card_transactions` | `id`, `card_id`, `amount`, `description`, `date`, `created_at` |
| `savings_withdrawals` (v2) | `id`, `tag` (savings pot), `amount`, `date`, `note`, `created_at` |

Conventions in the data layer:
- Dates are stored as **strings** (`date` = `"YYYY-MM-DD"`, `created_at` = ISO). Month keys are `date.slice(0, 7)` (`"YYYY-MM"`). Never store `Date` objects. To turn a timestamp into a date, use `localDate()` / `today()` from `utils/format.js`, never `iso.slice(0, 10)`: that gives the UTC date, which is yesterday before 05:30 IST.
- Transactions reference their type by **name**. `api.js` derives `type_kind` at read time, and all totals are computed from `type_kind`, not the type name.
- **Balance and savings rules** (in `domain/transactions.js` and `features/savings/domain.js`):
  - Current balance = earnings − expenses − savings that deduct from the balance.
  - Savings with `deduct_from_balance: false` (e.g. money given to you) never reduce the balance.
  - Using savings (a withdrawal) reduces savings only, never the balance. Overall Savings = all savings − withdrawals.
  - A pot can never go below zero: withdrawals are capped at the pot's remaining amount, and editing/deleting a Saving transaction that would push its pot negative is blocked.
- **Cross-feature hooks:** core `api.js` exposes `registerTransactionGuard(fn)` so a feature can veto ledger edits/deletes without the core importing the feature. Each feature wires itself up in its `features/<name>/index.js` entry point, and App imports the feature only from there.
- There are no foreign keys in IndexedDB, so cascades are done manually inside a Dexie transaction (see `deleteCreditCard` in `features/cards/api.js`).
- Option CRUD is generic over the `OPTION_KINDS` / `TABLE_BY_KIND` maps in `api.js`.

## Features / components

| Feature | Where |
|---|---|
| Navigation: bottom tabs Home · Report · **+** · Savings · More; More → Credit cards, Manage options; Android back button via hash routes | `App.jsx` (`ROUTES`, `TABS`), `app/` |
| Add/edit/delete transactions in a bottom sheet (amount, type chips, "Deduct from current balance" switch for savings, tag + recent-tag chips, date, note, payment method/source) | `features/ledger/TransactionSheet.jsx`, `TransactionForm.jsx` |
| Home: balance hero (current balance, overall savings), Income/Expenses/Saved cards for the filters, date-grouped transaction list | `features/home/HomePage.jsx`, `features/ledger/TransactionList.jsx` |
| Filters sheet: years × months, single type (All/Earning/Expense/Saving), balance deduction (All/From balance/Not from balance) when Saving, tags | `features/home/FilterSheet.jsx`, `matchesFilters` |
| Report: Expenses/Income/Savings toggle, donut by tag (top 7 + Other), per-tag share bars, % change vs previous month when one month is selected | `features/report/` |
| Savings: available/used summary, from/not-from balance split, per-tag pots with progress rings, "Use savings" sheet (capped at pot remaining), history filterable by pot | `features/savings/` |
| Tags page (More → Tags, or "By tag" on Home): all time by default, sections Expenses → Savings → Income, each tag with count, date range, total (savings split from/not from balance); expand for its transactions by month; search; period picker | `features/tags/` |
| Backup & restore (More → Backup & restore): export everything (data + theme) to a JSON file (download on web, share sheet on Android); import validates the whole file, upgrades older backups, shows a summary, then replaces all data atomically | `features/backup/` |
| Info buttons (ⓘ) explaining balance deduction, savings, credit cards and tags | `components/ui/InfoButton.jsx`, `content/help.js` |
| Credit cards: card visuals, log spend / delete per card, period picker, 6-month utilization chart (palette `--cat-1..8`) | `features/cards/` |
| Manage options: transaction types (with kind), payment methods, payment sources | `features/settings/SettingsPage.jsx` |
| Themes: background (System / Light / Dark / Black AMOLED) × accent (Purple, Blue, Green, Teal, Orange, Pink), saved per device, applied instantly | `theme/`, `features/appearance/`, More → Appearance |
| Safe-area insets for the Android status/nav bars | `App.css` |
| Offline storage and Android packaging | `db/`, `capacitor.config.json`, `client/android/` |

## UI conventions (One UI, one-handed)

- **Top third is for viewing, bottom is for doing.** Pages start with a tall `PageHeader` (large title that collapses into a sticky app bar on scroll) or the Home hero. Interactive controls sit lower: bottom nav, the centre + button, full-width primary buttons, and bottom sheets with their actions in the sheet footer.
- **Forms and pickers open in a `BottomSheet`**, never inline at the top of a page. Submit buttons live in the sheet footer (`<button form={FORM_ID}>`).
- **Tap targets ≥ 44px**, and choices are chips or segmented controls rather than small dropdowns where the list is short.
- **Cards and rows, not wide tables.** Only the utilization table remains, inside `.table-scroll`. Test at 360, 390 and 412px widths: there must be no horizontal page scroll.
- **Colors only from tokens**, never hard-coded. Neutrals/semantic colors live in `index.css` (light on `:root`, dark on `:root[data-theme="dark"]`). Anything brand-coloured uses the accent tokens (`--accent`, `--accent-soft`, `--on-accent`, `--hero-from/-to`) from `theme/palettes.css`, so it follows the user's chosen accent. Charts use `--cat-1..8` in fixed order.
- **Theme is per device display state** (localStorage via `theme/themeStore.js`), not ledger data, so it doesn't go in IndexedDB. Dark mode is driven by `data-theme` set in JS, not by a `prefers-color-scheme` media query.
- **Adding a palette:** add a light block and a dark block to `theme/palettes.css`, and an entry to `ACCENTS` in `theme/palettes.js`. Keep `--on-accent` on `--accent` and `--accent` on `--accent-soft` at ≥ 4.5:1 contrast.
- New pages: add to `ROUTES` in `App.jsx` (plus `TABS` if it needs a bottom tab; prefer adding it to the More page).
- **Explain non-obvious features in-app.** When a feature's purpose isn't self-evident, add a topic to `content/help.js` (what it is, why it exists, one example) and place an `InfoButton` next to it (`info` prop on `PageHeader` / `Switch`). If the ⓘ sits inside a `<label>`, give the label an explicit `htmlFor`, or taps on the label will open the help instead of toggling the control.
- Bottom sheets render into `<body>` via a portal and can stack (e.g. help on top of a form). Escape closes only the top one.

## How extensible the code is today

**Easy to extend:**
- New pages: create `features/<name>/` with a page that owns its state and data (see `features/savings/`), then add one line to `ROUTES` in `App.jsx`.
- New ledger-derived views: read from `useLedger()` instead of fetching and threading props.
- New UI: compose from `components/ui/` before writing new primitives.
- New option lists: add an entry to `OPTION_KINDS` / `TABLE_BY_KIND` / `NOT_FOUND_MESSAGE` plus a store and a seed.
- New validation: add pure helpers to `db/validators.js`. New business rules: add pure functions to a `domain.js`.
- Cross-feature rules: use `registerTransactionGuard` rather than importing a feature into the core.

**Friction points to be aware of (improve them when you touch them, don't spread them):**
- Filtering loads whole tables and filters in memory. That's fine at personal scale, but use Dexie indexes if data grows.
- Schema changes need a **new `db.version(n)`**, not an edit to an existing version. Editing one breaks existing installs, including users' phones.
- Savings pots are keyed by tag name, and withdrawals store the tag string, so renames rely on the savings guard.
- No automated tests yet. Browser checks are done manually or with a throwaway Playwright script.

## Rules for building new features

Every new feature must be **decoupled** so it can be added, changed, or removed without breaking existing features. Follow these rules:

1. **Feature isolation.** Put a new feature in its own module: `src/features/<feature>/` with its page/components, its own data functions (e.g. `features/<feature>/api.js`), and any feature-specific helpers. A feature should be removable by deleting its folder and its one registration line.
2. **Layering: UI → service → storage.** Components never import `db` or Dexie. All persistence goes through service functions (`api.js` or the feature's own api module), which return plain objects and throw `Error` with user-facing messages. Keep business logic (totals, grouping, validation) in pure functions outside components so it can be tested and reused.
3. **Single responsibility.** One component does one thing. Split pages into container (state + data loading) and presentational components (props in, JSX out), the way `SavingsPage` → `PotList` / `SavingsHistory` does. Keep files small and focused.
4. **Open/closed: extend, don't modify.** Prefer config maps and registries (like `OPTION_KINDS` / `TABLE_BY_KIND` / `ROUTES` / `KIND_META`) over new `if/else` or ternary branches.
5. **Don't touch unrelated features.** A new feature must not change the behavior, props, or data shape of existing features. If a shared contract (an `api.js` signature, a store shape, a component's props) must change, keep it backward-compatible and update every caller in the same change.
6. **DRY with shared utilities.** Reusable helpers belong in shared modules: `utils/format.js` for currency and dates, `components/ui/` for UI primitives, and `src/hooks/` for hooks. Don't copy-paste helpers.
7. **Safe schema evolution.** Add stores and indexes via a new `db.version(n).stores({...})` (with `.upgrade()` for data migrations). Never edit an existing version, never drop user data, and keep old data readable.
   **Every data change must keep backups working** (`features/backup/backupFormat.js`):
   - New table → add a spec to `TABLE_SPECS` (older backups just start it empty). Export and import refuse to run if a Dexie table has no spec, so a forgotten table can't be silently wiped.
   - New field → set it in that table's spec with a default for rows that lack it (like `deduct_from_balance`).
   - Changed meaning of existing data → bump `BACKUP_FORMAT` and add a `MIGRATIONS` step from the previous format.
   - Never make import accept a backup from a newer format. Validate every row before writing anything, and restore in a single transaction.
8. **Keep the offline, no-backend model.** No network calls, no server dependency, no new heavy dependencies without a clear need. Everything must work inside the Android WebView.
9. **Follow existing conventions.** Use string dates, `type_kind` for totals, errors surfaced via `ErrorBanner`, colors from CSS tokens (support both light and dark), respect the safe-area padding, follow the One UI conventions above, and match the existing JSX/CSS style.
10. **Verify before finishing.** Run `npm run lint` and `npm run build` in `client/`, then exercise the feature in `npm run dev` at phone width (360–412px) and desktop, in light and dark mode, including regressions on Home, Report, Savings, Credit cards and Manage options. If you add pure logic, add tests for it (introduce Vitest if it isn't set up yet).
