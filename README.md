# Expense Tracker

A full-stack expense tracking app. It lets you log expenses, filter by category, sort by date, and see a breakdown of spending per category.

Built with React on the frontend and Express + PostgreSQL on the backend.

**Live Demo**
- Frontend: https://expense-tracker-ashy-eta.vercel.app
- Backend API: https://expense-tracker-server-five-fawn.vercel.app

---

## Tech Stack

- **Frontend** — React, TanStack Query, Vite
- **Backend** — Node.js, Express, Zod
- **Database** — PostgreSQL via Neon (serverless)

---

## Running locally

### Backend

```bash
cd apps/api
npm install
npm run start
```

Create a `.env` file in `apps/api`:

```
DATABASE_URL=your_neon_connection_string
PORT=3000
```

### Frontend

```bash
cd apps/web
npm install
npm run dev
```

The Vite dev server proxies `/api` to `localhost:3000` so you don't need to configure anything else locally.

---

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/expenses` | Create a new expense |
| GET | `/api/expenses` | List expenses (filter + sort via query params) |
| GET | `/api/expenses/summary` | Total per category |

Query params for GET: `?category=Food&sort=date_desc`

---

## Design decisions

**Money stored as `NUMERIC(10,2)`**

I didn't want floating point issues with financial data. `FLOAT` in Postgres or plain JS numbers can give you things like `0.1 + 0.2 = 0.30000000000000004`. `NUMERIC` stores exact decimals, which matters when you're summing up amounts and showing totals.

**`DATE` column instead of `TIMESTAMP`**

Expenses belong to a calendar date, not a specific moment in time. I initially used `TIMESTAMP` and ran into a bug where users in UTC+ timezones would see the wrong date — JS parses UTC midnight and shifts it back by their offset. Switching to `DATE` and appending `T00:00:00` before parsing on the frontend fixed it.

**Duplicate prevention via a unique index**

I wanted the API to be safe against double submissions — if someone clicks submit twice or the page reloads mid-request. I started with a separate idempotency keys table but that felt like overkill for this scope. Simplified it to a `UNIQUE INDEX` on `(amount, category, date, COALESCE(description, ''))`. The `COALESCE` is necessary because Postgres treats two `NULL` values as distinct in a regular unique constraint, which would let duplicate no-description expenses through.

**Zod validation on both ends**

The controller validates the request body before touching the DB. The frontend validates before firing the mutation. I wanted both layers to fail fast with a clear message rather than letting bad data reach the database or show a confusing error.

**TanStack Query for server state**

It handles loading states, error states, caching, and refetching without me writing any of that manually. After a successful create, I call `invalidateQueries` and the list and summary both refresh automatically. It also retries failed requests once, which pairs well with the duplicate prevention on the backend.

**10 second request timeout**

All fetch calls use `AbortController` with a 10s timeout. Without this, a slow or hung network request just freezes the UI indefinitely with no way for the user to recover.

---

## What I didn't build (and why)

**Edit and delete** — the assignment was focused on creation and retrieval. The data model supports it and it would be straightforward to add.

**Auth** — out of scope for a single-user personal finance tool. If this were multi-user I'd add JWT-based auth and scope all queries by user ID.

**Pagination** — not needed at this scale. I'd add cursor-based pagination before putting this in front of real users with months of data.

**Tests** — I leaned on DB constraints and Zod schemas for correctness rather than writing a test suite, given the time constraint. The idempotency logic and date handling are the two things I'd test first.

---

## Project structure

```
apps/
  api/
    controllers/    request validation and response
    services/       database queries
    routes/         express router
    lib/            db connection
  web/
    src/
      components/   ExpenseForm, ExpenseTable, SummaryPanel
      hooks/        useExpenses, useCreateExpense
      lib/          api calls, date utils
      constants.js  category list
```
