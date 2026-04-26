import { useState } from "react";
import { CATEGORIES } from "../constants";
import { today } from "../lib/utils";

const initialForm = {
  amount: "",
  category: "",
  customCategory: "",
  description: "",
  date: "",
};

export default function ExpenseForm({ onSubmit, isPending, successMsg }) {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");

  function handleChange(e) {
    if (error) setError("");
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();

    const resolvedCategory =
      form.category === "Other" ? form.customCategory.trim() : form.category;

    if (!form.amount || !form.category || !form.date) {
      setError("Amount, category and date are required");
      return;
    }
    if (form.category === "Other" && !resolvedCategory) {
      setError("Please specify a category");
      return;
    }

    const amount = Number(form.amount);
    if (isNaN(amount) || amount <= 0) {
      setError("Amount must be a positive number");
      return;
    }

    onSubmit(
      { amount, category: resolvedCategory, description: form.description.trim(), date: form.date },
      {
        onSuccess: () => setForm(initialForm),
        onError: (err) => setError(err.message || "Could not save expense"),
      },
    );
  }

  return (
    <section className="card">
      <h2>Add Expense</h2>
      <form className="form-grid" onSubmit={handleSubmit}>
        <label>
          Amount <span className="required">*</span>
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
          Category <span className="required">*</span>
          <select name="category" value={form.category} onChange={handleChange} required>
            <option value="">Select category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>

        <label>
          Date <span className="required">*</span>
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
          Description <span className="optional">(optional)</span>
          <input
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Lunch with team"
          />
        </label>

        <button type="submit" disabled={isPending} className="full">
          {isPending ? "Saving..." : "Add Expense"}
        </button>
      </form>

      {error && <p className="error">{error}</p>}
      {successMsg && <p className="success">{successMsg}</p>}
    </section>
  );
}
