import sql from "../lib/db.js";

export async function create(data) {
  // ON CONFLICT DO NOTHING silently ignores duplicate submissions.
  // RETURNING * returns the existing row if a conflict occurs via a follow-up SELECT.
  const rows = await sql`
    INSERT INTO expenses (amount, category, description, date)
    VALUES (${data.amount}, ${data.category}, ${data.description || null}, ${data.date})
    ON CONFLICT (amount, category, date, description) DO NOTHING
    RETURNING *
  `;

  if (rows.length > 0) return rows[0];

  // Row already existed — return it
  const existing = await sql`
    SELECT * FROM expenses
    WHERE amount = ${data.amount}
      AND category = ${data.category}
      AND date = ${data.date}
      AND (description = ${data.description || null} OR (description IS NULL AND ${data.description || null} IS NULL))
    LIMIT 1
  `;
  return existing[0];
}

export async function list(query) {
  const desc = query.sort !== "date_asc";

  if (query.category) {
    return desc
      ? sql`SELECT * FROM expenses WHERE category = ${query.category} ORDER BY date DESC`
      : sql`SELECT * FROM expenses WHERE category = ${query.category} ORDER BY date ASC`;
  }

  return desc
    ? sql`SELECT * FROM expenses ORDER BY date DESC`
    : sql`SELECT * FROM expenses ORDER BY date ASC`;
}

export async function summary() {
  const rows = await sql`
    SELECT category, SUM(amount) AS total, COUNT(*) AS count
    FROM expenses
    GROUP BY category
    ORDER BY total DESC
  `;
  return rows.map((r) => ({
    category: r.category,
    total: Number(r.total),
    count: Number(r.count),
  }));
}
