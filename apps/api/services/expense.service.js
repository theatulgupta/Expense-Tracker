import sql from "../lib/db.js";

export async function create(data, idempotencyKey) {
  // Without a key, just insert — no idempotency guarantee
  if (!idempotencyKey) {
    const rows = await sql`
      INSERT INTO expenses (amount, category, description, date)
      VALUES (${data.amount}, ${data.category}, ${data.description || null}, ${data.date})
      RETURNING *
    `;
    return rows[0];
  }

  // With a key: check first to avoid unnecessary writes on retries
  const existing = await sql`
    SELECT e.* FROM expenses e
    JOIN idempotency_keys ik ON ik.expense_id = e.id
    WHERE ik.key = ${idempotencyKey}
  `;
  if (existing.length > 0) return existing[0];

  // Insert expense then record key atomically — prevents duplicate on concurrent retries
  const rows = await sql.transaction(async (tx) => {
    const inserted = await tx`
      INSERT INTO expenses (amount, category, description, date)
      VALUES (${data.amount}, ${data.category}, ${data.description || null}, ${data.date})
      RETURNING *
    `;
    await tx`
      INSERT INTO idempotency_keys (key, expense_id)
      VALUES (${idempotencyKey}, ${inserted[0].id})
      ON CONFLICT (key) DO NOTHING
    `;
    return inserted;
  });

  return rows[0];
}

export async function list(query) {
  // determine sort direction from query parameter
  const desc = query.sort === "date_desc";

  // filter by category if provided, otherwise list all
  if (query.category) {
    if (desc)
      return sql`SELECT * FROM expenses WHERE category = ${query.category} ORDER BY date DESC`;
    return sql`SELECT * FROM expenses WHERE category = ${query.category} ORDER BY date ASC`;
  }

  if (desc) return sql`SELECT * FROM expenses ORDER BY date DESC`;
  return sql`SELECT * FROM expenses ORDER BY date ASC`;
}

export async function summary() {
  const rows = await sql`
    SELECT category, SUM(amount) total, COUNT(*) count
    FROM expenses
    GROUP BY category
    ORDER BY total DESC
  `;
  return rows.map((r) => ({
    category: r.category,
    total: Number(r.total),
    count: r.count,
  }));
}
