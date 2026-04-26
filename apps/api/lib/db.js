import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const sql = neon(process.env.DATABASE_URL);

export async function connectDB() {
  try {
    await sql`SELECT 1`;

    await sql`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
        category VARCHAR(255) NOT NULL,
        description TEXT,
        date TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS idempotency_keys (
        key TEXT PRIMARY KEY,
        expense_id INTEGER REFERENCES expenses(id),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    console.log("✓ Database ready");
  } catch (err) {
    console.error("✗ Database error:", err.message);
    process.exit(1);
  }
}

export default sql;
