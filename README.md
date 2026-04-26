# Expense Tracker

A full-stack expense tracking application with a React frontend and Node.js backend.

## Architecture

- **Frontend**: React web app for tracking expenses
- **Backend**: Express.js API with Neon PostgreSQL
- **Database**: PostgreSQL (Neon serverless)

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

- `POST /api/expenses` - Create expense
- `GET /api/expenses` - List expenses (supports `?category=Food&sort=date_desc`)
- `GET /api/expenses/summary` - Category breakdown with totals

## Design Decisions

1. **Money as NUMERIC(10,2)**: PostgreSQL NUMERIC type preserves decimal precision for financial data without floating-point rounding errors
2. **CHECK constraint for amounts**: Database enforces positive amounts at the constraint level
3. **Single date field**: Uses `date` as the transaction timestamp, with `created_at` for audit trail
4. **Minimal validation**: Client-side Zod schemas catch invalid input early; database constraints act as safety net
5. **Stateless API**: No session management - suitable for expense tracking use case

## Trade-offs

- **No authentication**: Scope limitation for timebox; suitable for personal use
- **No edit/delete operations**: MVP focuses on creation and retrieval
- **No pagination**: Assumes reasonable data volume for expense tracker
- **Sync API only**: No real-time updates; acceptable for CRUD operations

## Intentionally Not Done

- Update/delete endpoints (can add if needed)
- User accounts or multi-tenancy (assume single user)
- Advanced analytics (filters, forecasting)
- Mobile app (web app is responsive)
- Testing suite (focus on code correctness via constraints)
