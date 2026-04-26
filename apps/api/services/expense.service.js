import sql from "../lib/db.js";

export async function create(data) {
  const rows = await sql`
    INSERT INTO expenses (amount, category, description, date)
    VALUES (${data.amount}, ${data.category}, ${data.description || null}, ${new Date(data.date)})
    RETURNING *
  `;
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
