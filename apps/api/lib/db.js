import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const sql = neon(process.env.DATABASE_URL);

export async function connectDB() {
  try {
    await sql`SELECT 1`;

    await sql`
      CREATE TABLE IF NOT EXISTS expenses (
        id          SERIAL PRIMARY KEY,
        amount      NUMERIC(10,2) NOT NULL CHECK (amount > 0),
        category    VARCHAR(100)  NOT NULL,
        description TEXT,
        date        DATE          NOT NULL,
        created_at  TIMESTAMP     DEFAULT NOW()
      )
    `;

    // unique index uses COALESCE so two null descriptions are treated as duplicates
    await sql`
      CREATE UNIQUE INDEX IF NOT EXISTS expenses_dedup_idx
      ON expenses (amount, category, date, COALESCE(description, ''))
    `;

    console.log("✓ database ready");
  } catch (err) {
    console.error("✗ database error:", err.message);
    process.exit(1);
  }
}

export default sql;
