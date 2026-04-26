import { z } from "zod";
import * as Expense from "../services/expense.service.js";

// request validation schemas
const createSchema = z.object({
  amount: z.number().positive(),
  category: z.string().min(1),
  description: z.string().optional(),
  date: z.string(),
});

const listSchema = z.object({
  category: z.string().optional(),
  sort: z.enum(["date_asc", "date_desc"]).optional(),
});

export async function create(req, res, next) {
  try {
    const body = createSchema.parse(req.body);
    const expense = await Expense.create(body);
    res.status(201).json(expense);
  } catch (err) {
    // zod validation errors go back to client, other errors passed to error handler
    if (err instanceof z.ZodError)
      return res.status(400).json({ issues: err.errors });
    next(err);
  }
}

export async function list(req, res, next) {
  try {
    const filters = listSchema.parse(req.query);
    const expenses = await Expense.list(filters);
    // convert db strings to numbers for accurate financial totals
    const total = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    res.json({ count: expenses.length, total, items: expenses });
  } catch (err) {
    if (err instanceof z.ZodError)
      return res.status(400).json({ issues: err.errors });
    next(err);
  }
}

export async function summary(req, res, next) {
  try {
    const data = await Expense.summary();
    res.json(data);
  } catch (err) {
    next(err);
  }
}
