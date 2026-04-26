import sql from "../lib/db.js";

export async function create(data) {
  const description = data.description || null;

  const rows = await sql`
    INSERT INTO expenses (amount, category, description, date)
    VALUES (${data.amount}, ${data.category}, ${description}, ${data.date})
    ON CONFLICT (amount, category, date, COALESCE(description, '')) DO NOTHING
    RETURNING *
  `;

  if (rows.length > 0) return rows[0];

  // conflict hit — return the existing row
  const existing = await sql`
    SELECT * FROM expenses
    WHERE amount = ${data.amount}
      AND category = ${data.category}
      AND date = ${data.date}
      AND COALESCE(description, '') = ${description || ""}
    LIMIT 1
  `;
  return existing[0];
}

export async function list(query) {
  const newest = query.sort !== "date_asc";

  if (query.category) {
    return newest
      ? sql`SELECT * FROM expenses WHERE category = ${query.category} ORDER BY date DESC`
      : sql`SELECT * FROM expenses WHERE category = ${query.category} ORDER BY date ASC`;
  }

  return newest
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
