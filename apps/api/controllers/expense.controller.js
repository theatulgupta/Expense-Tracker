import { z } from "zod";
import * as Expense from "../services/expense.service.js";

const createSchema = z.object({
  amount: z.number().positive(),
  category: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "date must be YYYY-MM-DD"),
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
    if (err instanceof z.ZodError)
      return res.status(400).json({ error: err.errors[0].message });
    next(err);
  }
}

export async function list(req, res, next) {
  try {
    const filters = listSchema.parse(req.query);
    const expenses = await Expense.list(filters);
    const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    res.json({ count: expenses.length, total, items: expenses });
  } catch (err) {
    if (err instanceof z.ZodError)
      return res.status(400).json({ error: err.errors[0].message });
    next(err);
  }
}

export async function summary(req, res, next) {
  try {
    res.json(await Expense.summary());
  } catch (err) {
    next(err);
  }
}
