# Expense Tracker

A personal expense tracker that runs fully offline, on-device — as a web app or as an installable Android app. Track earnings, expenses, and savings, log credit card spending separately from your regular ledger, filter by year, month, or tag, and see spending breakdowns at a glance. All data lives in the browser's IndexedDB (or the app's local storage on Android); there's no server or database to run for day-to-day use.

## Features

- **Transactions** — add, edit, and delete entries with an amount, tag, date, optional note, payment method, and payment source.
- **Custom types** — transactions are one of three kinds: `earning`, `expense`, or `saving`. New transaction types, payment methods, and payment sources can be added or removed from the "Manage options" page.
- **Filtering** — filter the transaction list and summary with independent multi-select dropdowns for year and month (any combination of years × months), plus a tag filter.
- **Summary panel** — total earnings, total expenses, savings for the current selection, all-time savings, and current balance (earnings − expenses − savings), computed across your whole history regardless of the active filter.
- **Spending by tag** — a bar chart plus a table showing how much was spent per tag and its share of total expenses.
- **Credit card tracking** — add credit cards, log transactions against each one (kept fully separate from the main ledger so nothing is double-counted — useful for catching spend a statement misses), and a monthly utilization bar chart comparing spend across cards.
- **Fully offline** — the client stores everything on-device (IndexedDB via Dexie); no network calls happen during normal use.
- **Installable Android app** — the same React app packaged with Capacitor into a real `.apk`, built via GitHub Actions (see below).

## Project structure

```
client/                    React app (Vite) — the actual app, runs fully offline on IndexedDB
  src/db/                  Dexie/IndexedDB data layer (schema, seed data, validation)
  android/                 Capacitor's native Android project (generated; commit as-is)
.github/workflows/         GitHub Actions workflow that builds the Android APK
server/                    Legacy Node/Express + PostgreSQL API — no longer used by the app;
                           kept only as a dev-only reference and as the source for the one-time
                           data migration script that seeded the on-device database
```

## Running the app (web)

```bash
cd client
npm install
npm run dev
```

Vite serves the app at `http://localhost:5173`. No database, server, or `.env` setup needed — the app creates and seeds its own IndexedDB database (`expense-tracker`) on first load.

```bash
npm run build      # production build, outputs to client/dist
npm run preview    # serve that production build locally
```

## Building the Android APK

The app is wrapped with [Capacitor](https://capacitorjs.com/). Since building an `.apk` requires a full Android SDK/Java toolchain, this is done via a GitHub Actions workflow rather than locally:

1. Push to `main` (or just have the workflow file present).
2. In GitHub, go to **Actions → Build Android APK → Run workflow**.
3. Once it finishes, open the run and download the `app-debug-apk` artifact — it contains `app-debug.apk`.
4. Sideload it onto an Android phone (enable "install unknown apps" for whichever app you use to open the file, then tap it to install).

This produces an **unsigned debug build**, fine for installing on your own device. There's no signing keystore set up yet, so it's not set up for wider distribution (e.g. Play Store).

If you want to build/test locally instead, install Android Studio (includes the SDK and an emulator), then:

```bash
cd client
npm run cap:sync     # builds the web assets and syncs them into android/
npx cap open android # opens the native project in Android Studio
```

## Legacy server (optional, not required to use the app)

Before the app moved to on-device storage, it was a full-stack app backed by a Node/Express API and PostgreSQL. That server is kept in the repo for reference and as the source of the one-time export used to migrate existing data into IndexedDB — it is **not** used by the app anymore. If you want to run it anyway:

```bash
createdb expense_tracker
psql -d expense_tracker -f server/schema.sql

cd server
cp .env.example .env   # edit with your Postgres credentials
npm install
npm start
```

Environment variables (`server/.env`):

| Variable      | Description                  | Default   |
|---------------|-------------------------------|-----------|
| `PGHOST`      | Postgres host                 | localhost |
| `PGPORT`      | Postgres port                 | 5432      |
| `PGUSER`      | Postgres user                 | postgres  |
| `PGPASSWORD`  | Postgres password              | —         |
| `PGDATABASE`  | Database name                 | expense_tracker |
| `PORT`        | API server port               | 4000      |
