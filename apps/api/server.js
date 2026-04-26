import express from "express";
import "dotenv/config";
import cors from "cors";
import morgan from "morgan";
import { connectDB } from "./lib/db.js";
import expenses from "./routes/expense.route.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

app.get("/", (req, res) => res.json({ status: "ok" }));
app.use("/api/expenses", expenses);

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const status = err.status || 500;
  console.error(`[${status}]`, err.message);
  res.status(status).json({ error: err.message || "Server error" });
});

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (err) {
    console.error("Failed to start:", err.message);
    process.exit(1);
  }
}

start();
export default app;
