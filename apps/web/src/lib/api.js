const API_BASE = import.meta.env.VITE_API_URL || "";

function withBase(path) {
  return `${API_BASE}${path}`;
}

export async function fetchExpenses({ category, sort }) {
  const params = new URLSearchParams();

  if (category) params.set("category", category);
  if (sort) params.set("sort", sort);

  const query = params.toString();
  const url = withBase(`/api/expenses${query ? `?${query}` : ""}`);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Could not load expenses");
  }

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
    const message = data.error || "Could not create expense";
    throw new Error(message);
  }

  return res.json();
}
