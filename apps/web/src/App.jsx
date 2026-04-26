import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createExpense, fetchExpenses } from "./lib/api";
import SummaryPanel from "./SummaryPanel";

const initialForm = {
  amount: "",
  category: "",
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
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("date_desc");
  const [submitError, setSubmitError] = useState("");
  const idempotencyKey = useRef(newKey());
  const queryClient = useQueryClient();

  const expensesQuery = useQuery({
    queryKey: ["expenses", { category, sort }],
    queryFn: () => fetchExpenses({ category, sort }),
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

  const categories = useMemo(() => {
    const list = items.map((item) => item.category).filter(Boolean);
    return [...new Set(list)].sort((a, b) => a.localeCompare(b));
  }, [items]);

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

    if (!form.amount || !form.category || !form.date) {
      setSubmitError("amount, category and date are required");
      return;
    }

    const parsedAmount = Number(form.amount);
    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setSubmitError("amount must be a positive number");
      return;
    }

    createMutation.mutate({
      amount: parsedAmount,
      category: form.category.trim(),
      description: form.description.trim(),
      date: form.date,
    });
  }

  return (
    <main className="page">
      <header className="header">
        <h1>expense tracker</h1>
        <p>track spending with reliable totals</p>
      </header>

      <section className="card">
        <h2>add expense</h2>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            amount
            <input
              name="amount"
              type="number"
              step="0.01"
              min="0"
              value={form.amount}
              onChange={handleChange}
              placeholder="0.00"
              required
            />
          </label>

          <label>
            category
            <input
              name="category"
              value={form.category}
              onChange={handleChange}
              placeholder="food"
              required
            />
          </label>

          <label>
            date
            <input
              name="date"
              type="date"
              value={form.date}
              onChange={handleChange}
              required
            />
          </label>

          <label className="full">
            description
            <input
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="lunch with team"
            />
          </label>

          <button
            type="submit"
            disabled={createMutation.isPending}
            className="full submit"
          >
            {createMutation.isPending ? "saving..." : "add expense"}
          </button>
        </form>
        {submitError ? <p className="error">{submitError}</p> : null}
      </section>

      <section className="card">
        <div className="toolbar">
          <h2>expenses</h2>
          <div className="controls">
            <label>
              category
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">all</option>
                {categories.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              sort
              <select value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="date_desc">newest first</option>
                <option value="date_asc">oldest first</option>
              </select>
            </label>
          </div>
        </div>

        {expensesQuery.isLoading ? <p>loading expenses...</p> : null}
        {expensesQuery.isError ? (
          <p className="error">could not load expenses. please retry.</p>
        ) : null}

        {!expensesQuery.isLoading && !expensesQuery.isError ? (
          <>
            <p className="total">total: ₹{total.toFixed(2)}</p>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>date</th>
                    <th>category</th>
                    <th>description</th>
                    <th className="right">amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="empty">
                        no expenses yet
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
