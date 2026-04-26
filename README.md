# Expense Tracker

A full-stack expense tracking application with a React frontend and Node.js backend.

## Architecture

- **Frontend**: React + TanStack Query — form, list, filter, sort, totals, summary
- **Backend**: Express.js API with Zod validation
- **Database**: PostgreSQL via Neon (serverless)

## Setup

### Backend

```bash
cd apps/api
npm install
npm run start
```

Create `.env`:

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

## API Endpoints

- `POST /api/expenses` — Create expense (idempotent via `Idempotency-Key` header)
- `GET /api/expenses` — List expenses (supports `?category=Food&sort=date_desc`)
- `GET /api/expenses/summary` — Category breakdown with totals

## Design Decisions

1. **Money as `NUMERIC(10,2)`**: PostgreSQL NUMERIC preserves exact decimal precision for financial data — no floating-point rounding errors that `FLOAT` or JS `number` arithmetic would introduce.

2. **`DATE` column, not `TIMESTAMP`**: Expenses have a calendar date (e.g. "26 Apr 2026"), not a point in time. Using `TIMESTAMP` causes UTC-offset bugs where `toLocaleDateString()` on the frontend renders the wrong day for users in UTC+ timezones.

3. **Idempotency via a dedicated `idempotency_keys` table**: The client generates a UUID per form submission (stored in `useRef` so it survives re-renders) and sends it as an `Idempotency-Key` header. The server checks for an existing key before inserting. The insert + key write happen inside a **transaction** to eliminate the check-then-insert race condition under concurrent retries. The key rotates only on success, so page refreshes or network retries before success replay safely.

4. **CHECK constraint on `amount > 0`**: Database enforces positive amounts as a hard constraint — validation at the application layer (Zod + frontend) is the first line of defence, but the DB is the source of truth.

5. **Zod on both layers**: Controller validates request shape with Zod before touching the DB. Frontend validates before firing the mutation. Both layers fail fast with clear messages.

6. **TanStack Query for all server state**: Handles caching, background refetch, loading/error states, and retry logic without custom hooks. `invalidateQueries` after a successful create keeps the list and summary in sync.

## Trade-offs

- **No authentication**: Single-user scope; adding auth would require session management, token refresh, and user-scoped queries — out of scope for this timebox.
- **No edit/delete**: MVP focuses on creation and retrieval. The data model supports it trivially if needed.
- **No pagination**: Assumes a personal expense tracker with a reasonable row count. Would add `LIMIT/OFFSET` or cursor pagination before scaling.
- **No automated tests**: Correctness is enforced via DB constraints, Zod schemas, and idempotency logic rather than a test suite. Would add integration tests for the idempotency path and service layer as a next step.

## Intentionally Not Done

- Update/delete endpoints
- User accounts or multi-tenancy
- Advanced analytics or forecasting
- Real-time updates (WebSocket/SSE)
- Pagination
