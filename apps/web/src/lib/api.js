const API_BASE = import.meta.env.VITE_API_URL || "";

// aborts after 10s so a hung network doesn't freeze the ui
function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  return fetch(url, { ...options, signal: controller.signal }).finally(() =>
    clearTimeout(timer),
  );
}

export async function fetchExpenses({ category, sort }) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (sort) params.set("sort", sort);

  const query = params.toString();
  const res = await fetchWithTimeout(
    `${API_BASE}/api/expenses${query ? `?${query}` : ""}`,
  );
  if (!res.ok) throw new Error("Could not load expenses");
  return res.json();
}

export async function fetchSummary() {
  const res = await fetchWithTimeout(`${API_BASE}/api/expenses/summary`);
  if (!res.ok) throw new Error("Could not load summary");
  return res.json();
}

export async function createExpense(payload) {
  const res = await fetchWithTimeout(`${API_BASE}/api/expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Could not create expense");
  }

  return res.json();
}
