# Expense Tracker

A full-stack expense tracking app I built as part of a technical assessment. It lets you log expenses, filter by category, sort by date, and see a breakdown of spending per category.

Built with React on the frontend and Express + PostgreSQL on the backend.

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

## Design decisions I made

**Money stored as `NUMERIC(10,2)`**
I didn't want floating point issues with financial data. `FLOAT` in Postgres (or plain JS numbers) can give you things like `0.1 + 0.2 = 0.30000000000000004`. `NUMERIC` stores exact decimals.

**`DATE` column instead of `TIMESTAMP`**
Expenses belong to a calendar date, not a specific moment in time. If I stored a timestamp and then called `toLocaleDateString()` on the frontend, users in UTC+ timezones would see the wrong date because JS parses UTC midnight and shifts it back. Using `DATE` and appending `T00:00:00` before parsing fixes this.

**Duplicate prevention via a unique index**
Instead of a separate idempotency keys table (which I had initially), I simplified to a `UNIQUE INDEX` on `(amount, category, date, COALESCE(description, ''))`. If you submit the same expense twice, the second insert hits `ON CONFLICT DO NOTHING` and returns the existing row. The `COALESCE` is needed because Postgres treats two `NULL` values as distinct in a regular UNIQUE constraint.

**Zod validation on both ends**
The controller validates the request body before touching the DB. The frontend validates before firing the mutation. Both fail fast with a clear message rather than letting bad data through.

**TanStack Query for server state**
Handles loading states, error states, caching, and refetching without me writing any of that manually. After a successful create, I just call `invalidateQueries` and the list + summary refresh automatically.

**10 second request timeout**
All fetch calls use `AbortController` with a 10s timeout. Without this, a slow network just hangs the UI with no feedback.

---

## What I didn't build (and why)

- **Edit / delete** — the assignment was focused on creation and retrieval, and the data model supports it easily if needed
- **Auth** — out of scope for a single-user personal finance tool
- **Pagination** — not needed at this scale, but I'd add cursor-based pagination before putting this in front of real users
- **Tests** — I relied on DB constraints and Zod schemas for correctness instead of a test suite, given the time constraint

---

## Project structure

```
apps/
  api/          Express backend
    controllers/
    services/
    routes/
    lib/
  web/          React frontend
    src/
      components/
      hooks/
      lib/
```
