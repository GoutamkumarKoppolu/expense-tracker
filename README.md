# Expense Tracker

A full-stack expense tracker with a Node/Express + PostgreSQL API and a React (Vite) frontend. Track earnings, expenses, and savings, filter by month or tag, and see a spending breakdown at a glance.

## Features

- **Transactions** — add, edit, and delete entries with an amount, tag, date, optional note, payment method, and payment source.
- **Custom types** — transactions are one of three kinds: `earning`, `expense`, or `saving`. New transaction types, payment methods, and payment sources can be added or removed from the "Manage options" page.
- **Filtering** — filter the transaction list and summary by one or more months (last 12 months available) and by tag.
- **Summary panel** — total earnings, total expenses, savings for the current selection, all-time savings, and current balance (earnings − expenses − savings), computed across your whole history regardless of the active filter.
- **Spending by tag** — a bar chart plus a table showing how much was spent per tag and its share of total expenses.
- **REST API** with endpoints for transactions, tags, an all-time overview, and the option lists (`/transaction-types`, `/payment-methods`, `/payment-sources`).

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [PostgreSQL](https://www.postgresql.org/) running locally (or a reachable instance)

## Project structure

```
server/   Express API (Node, pg)
client/   React app (Vite)
```

## Getting started

### 1. Set up the database

Create a database and load the schema:

```bash
createdb expense_tracker
psql -d expense_tracker -f server/schema.sql
```

`schema.sql` creates the required tables and seeds default transaction types (`expense`, `earning`, `saving`), payment methods (Cash, Card, UPI, Bank Transfer), and payment sources (PhonePe, Google Pay, Paytm). It's safe to re-run.

### 2. Configure and start the server

```bash
cd server
cp .env.example .env   # edit with your Postgres credentials
npm install
npm start               # or `npm run dev` to auto-restart on changes
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

The API starts at `http://localhost:4000` (health check at `/health`).

### 3. Start the client

In a separate terminal:

```bash
cd client
npm install
npm run dev
```

Vite serves the app at `http://localhost:5173` by default. The client is configured to talk to the API at `http://localhost:4000` (see `client/src/api.js`), so make sure the server is running first.

## Building for production

```bash
cd client
npm run build      # outputs to client/dist
npm run preview    # serve the production build locally
```

The Express server (`npm start` in `server/`) can be run as-is behind a process manager or reverse proxy for production API hosting.
