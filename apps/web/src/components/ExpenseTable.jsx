import { CATEGORIES } from "../constants";
import { formatDate } from "../lib/utils";

function SkeletonRows() {
  return [1, 2, 3].map((n) => (
    <tr key={n} className="skeleton-row">
      <td><span className="skeleton" /></td>
      <td><span className="skeleton" /></td>
      <td><span className="skeleton" /></td>
      <td><span className="skeleton skeleton-sm" /></td>
    </tr>
  ));
}

function TableHead() {
  return (
    <thead>
      <tr>
        <th>Date</th>
        <th>Category</th>
        <th>Description</th>
        <th className="right">Amount</th>
      </tr>
    </thead>
  );
}

export default function ExpenseTable({
  items,
  total,
  isLoading,
  isError,
  error,
  onRetry,
  filterCategory,
  onFilterCategory,
  sort,
  onSort,
}) {
  return (
    <section className="card">
      <div className="toolbar">
        <h2>Expenses</h2>
        <div className="controls">
          <label>
            Category
            <select value={filterCategory} onChange={(e) => onFilterCategory(e.target.value)}>
              <option value="">All</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Sort
            <select value={sort} onChange={(e) => onSort(e.target.value)}>
              <option value="date_desc">Newest first</option>
              <option value="date_asc">Oldest first</option>
            </select>
          </label>
        </div>
      </div>

      {isLoading && (
        <div className="table-wrap">
          <table>
            <TableHead />
            <tbody><SkeletonRows /></tbody>
          </table>
        </div>
      )}

      {isError && (
        <div className="error-state">
          <p className="error">
            {error?.name === "AbortError"
              ? "Request timed out. Check your connection."
              : "Could not load expenses."}
          </p>
          <button type="button" className="retry" onClick={onRetry}>Retry</button>
        </div>
      )}

      {!isLoading && !isError && (
        <>
          <p className="total">Total: ₹{total.toFixed(2)}</p>
          <div className="table-wrap">
            <table>
              <TableHead />
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
  );
}
