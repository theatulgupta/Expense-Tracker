import { useMemo, useState } from "react";
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

// en-CA locale gives YYYY-MM-DD format, used as the date input max
const today = new Date().toLocaleDateString("en-CA");

// Postgres DATE strings ("2026-04-26") parse as UTC midnight in JS.
// Appending T00:00:00 forces local-time parse so the displayed date is correct.
function formatDate(dateStr) {
  const d = new Date(`${String(dateStr).slice(0, 10)}T00:00:00`);
  return isNaN(d) ? dateStr : d.toLocaleDateString();
}

function App() {
  const [form, setForm] = useState(initialForm);
  const [filterCategory, setFilterCategory] = useState("");
  const [sort, setSort] = useState("date_desc");
  const [submitError, setSubmitError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const queryClient = useQueryClient();

  const expensesQuery = useQuery({
    queryKey: ["expenses", { category: filterCategory, sort }],
    queryFn: () => fetchExpenses({ category: filterCategory, sort }),
  });

  const items = useMemo(() => {
    const data = expensesQuery.data;
    if (!data) return [];
    return Array.isArray(data) ? data : data.items ?? data.data ?? [];
  }, [expensesQuery.data]);

  const total = useMemo(
    () => items.reduce((sum, row) => sum + Number(row.amount), 0),
    [items],
  );

  const createMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: async () => {
      setForm(initialForm);
      setSubmitError("");
      setSuccessMsg("Expense saved!");
      setTimeout(() => setSuccessMsg(""), 3000);
      await queryClient.invalidateQueries({ queryKey: ["expenses"] });
      await queryClient.invalidateQueries({ queryKey: ["summary"] });
    },
    onError: (err) => setSubmitError(err.message || "Could not save expense"),
  });

  function handleChange(e) {
    if (submitError) setSubmitError("");
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();

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

    const amount = Number(form.amount);
    if (isNaN(amount) || amount <= 0) {
      setSubmitError("Amount must be a positive number");
      return;
    }

    createMutation.mutate({
      amount,
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
              max={today}
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

          <button type="submit" disabled={createMutation.isPending} className="full">
            {createMutation.isPending ? "Saving..." : "Add Expense"}
          </button>
        </form>

        {submitError && <p className="error">{submitError}</p>}
        {successMsg && <p className="success">{successMsg}</p>}
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

        {expensesQuery.isLoading && (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th><th>Category</th><th>Description</th><th className="right">Amount</th>
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
        )}

        {expensesQuery.isError && (
          <div className="error-state">
            <p className="error">
              {expensesQuery.error?.name === "AbortError"
                ? "Request timed out. Check your connection."
                : "Could not load expenses."}
            </p>
            <button type="button" className="retry" onClick={() => expensesQuery.refetch()}>
              Retry
            </button>
          </div>
        )}

        {!expensesQuery.isLoading && !expensesQuery.isError && (
          <>
            <p className="total">Total: ₹{total.toFixed(2)}</p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Date</th><th>Category</th><th>Description</th><th className="right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="empty">No expenses yet</td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item.id}>
                        <td>{formatDate(item.date)}</td>
                        <td>{item.category}</td>
                        <td>{item.description || "-"}</td>
                        <td className="right">₹{Number(item.amount).toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <SummaryPanel />
    </main>
  );
}

export default App;
