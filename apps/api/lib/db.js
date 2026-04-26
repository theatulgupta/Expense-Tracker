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
        created_at  TIMESTAMP     DEFAULT NOW(),
        -- prevents duplicate submissions (same amount+category+date+description)
        UNIQUE (amount, category, date, description)
      )
    `;

    console.log("✓ Database ready");
  } catch (err) {
    console.error("✗ Database error:", err.message);
    process.exit(1);
  }
}

export default sql;
