const API_BASE = import.meta.env.VITE_API_URL || "";

function withBase(path) {
  return `${API_BASE}${path}`;
}

export async function fetchExpenses({ category, sort }) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (sort) params.set("sort", sort);

  const query = params.toString();
  const res = await fetch(withBase(`/api/expenses${query ? `?${query}` : ""}`));
  if (!res.ok) throw new Error("Could not load expenses");
  return res.json();
}

export async function fetchSummary() {
  const res = await fetch(withBase("/api/expenses/summary"));
  if (!res.ok) throw new Error("Could not load summary");
  return res.json();
}

export async function createExpense(payload, idempotencyKey) {
  const res = await fetch(withBase("/api/expenses"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Could not create expense");
  }

  return res.json();
}
