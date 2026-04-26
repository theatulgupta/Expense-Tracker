// en-CA locale gives YYYY-MM-DD, used as the date input max
export const today = new Date().toLocaleDateString("en-CA");

// Postgres DATE strings ("2026-04-26") parse as UTC midnight in JS.
// Appending T00:00:00 forces local-time parse so the displayed date is correct.
export function formatDate(dateStr) {
  const d = new Date(`${String(dateStr).slice(0, 10)}T00:00:00`);
  return isNaN(d) ? dateStr : d.toLocaleDateString();
}
