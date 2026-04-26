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

// 4-arg signature is required for express to treat this as an error handler
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  const status = err.status || 500;
  console.error(`[${status}]`, err.message);
  res.status(status).json({ error: err.message || "server error" });
});

async function start() {
  try {
    await connectDB();
    app.listen(PORT, () => console.log(`server running on port ${PORT}`));
  } catch (err) {
    console.error("failed to start:", err.message);
    process.exit(1);
  }
}

start();
export default app;
