import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createExpense, fetchExpenses } from "./lib/api";
import SummaryPanel from "./SummaryPanel";

const CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Entertainment",
  "Health",
  "Utilities",
  "Rent",
  "Education",
  "Travel",
  "Other",
];

const initialForm = {
  amount: "",
  category: "",
  customCategory: "",
  description: "",
  date: "",
};

function newKey() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

function App() {
  const [form, setForm] = useState(initialForm);
  const [filterCategory, setFilterCategory] = useState("");
  const [sort, setSort] = useState("date_desc");
  const [submitError, setSubmitError] = useState("");
  const idempotencyKey = useRef(newKey());
  const queryClient = useQueryClient();

  const expensesQuery = useQuery({
    queryKey: ["expenses", { category: filterCategory, sort }],
    queryFn: () => fetchExpenses({ category: filterCategory, sort }),
  });

  const items = useMemo(() => {
    if (!expensesQuery.data) return [];
    if (Array.isArray(expensesQuery.data)) return expensesQuery.data;
    return expensesQuery.data.items || expensesQuery.data.data || [];
  }, [expensesQuery.data]);

  const total = useMemo(
    () => items.reduce((sum, row) => sum + Number(row.amount), 0),
    [items],
  );

  const createMutation = useMutation({
    mutationFn: (values) => createExpense(values, idempotencyKey.current),
    onSuccess: async () => {
      setForm(initialForm);
      idempotencyKey.current = newKey();
      await queryClient.invalidateQueries({ queryKey: ["expenses"] });
      await queryClient.invalidateQueries({ queryKey: ["summary"] });
      setSubmitError("");
    },
    onError: (error) => {
      setSubmitError(error.message || "Could not save expense");
    },
  });

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleSubmit(event) {
    event.preventDefault();

    const resolvedCategory =
      form.category === "Other" ? form.customCategory.trim() : form.category;

    if (!form.amount || !form.category || !form.date) {
      setSubmitError("Amount, category and date are required");
      return;
    }
    if (form.category === "Other" && !resolvedCategory) {
      setSubmitError("Please specify a category");
      return;
    }

    const parsedAmount = Number(form.amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setSubmitError("Amount must be a positive number");
      return;
    }

    createMutation.mutate({
      amount: parsedAmount,
      category: resolvedCategory,
      description: form.description.trim(),
      date: form.date,
    });
  }

  return (
    <main className="page">
      <header className="header">
        <h1>Expense Tracker</h1>
        <p>Track spending with reliable totals</p>
      </header>

      <section className="card">
        <h2>Add Expense</h2>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Amount
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={form.amount}
              onChange={handleChange}
              placeholder="0.00"
              required
            />
          </label>

          <label>
            Category
            <select name="category" value={form.category} onChange={handleChange} required>
              <option value="">Select category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>

          <label>
            Date
            <input
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              required
            />
          </label>

          {form.category === "Other" && (
            <label className="full">
              Specify Category
              <input
                name="customCategory"
                value={form.customCategory}
                onChange={handleChange}
                placeholder="e.g. Gifts"
                required
              />
            </label>
          )}

          <label className="full">
            Description
            <input
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Lunch with team"
            />
          </label>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="full submit"
          >
            {createMutation.isPending ? "Saving..." : "Add Expense"}
          </button>
        </form>
        {submitError ? <p className="error">{submitError}</p> : null}
      </section>

      <section className="card">
        <div className="toolbar">
          <h2>Expenses</h2>
          <div className="controls">
            <label>
              Category
              <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                <option value="">All</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>

            <label>
              Sort
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="date_desc">Newest first</option>
                <option value="date_asc">Oldest first</option>
              </select>
            </label>
          </div>
        </div>

        {expensesQuery.isLoading ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th className="right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map((n) => (
                  <tr key={n} className="skeleton-row">
                    <td><span className="skeleton" /></td>
                    <td><span className="skeleton" /></td>
                    <td><span className="skeleton" /></td>
                    <td><span className="skeleton skeleton-sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}

        {expensesQuery.isError ? (
          <div className="error-state">
            <p className="error">Could not load expenses.</p>
            <button
              type="button"
              className="retry"
              onClick={() => expensesQuery.refetch()}
            >
              Retry
            </button>
          </div>
        ) : null}

        {!expensesQuery.isLoading && !expensesQuery.isError ? (
          <>
            <p className="total">Total: ₹{total.toFixed(2)}</p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th className="right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="empty">
                        No expenses yet
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id}>
                        <td>{new Date(item.date).toLocaleDateString()}</td>
                        <td>{item.category}</td>
                        <td>{item.description || "-"}</td>
                        <td className="right">
                          ₹{Number(item.amount).toFixed(2)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </section>

      <SummaryPanel />
    </main>
  );
}

export default App;
