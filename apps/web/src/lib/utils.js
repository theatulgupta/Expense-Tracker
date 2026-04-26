// en-CA gives YYYY-MM-DD format, needed for the date input max attribute
export const today = new Date().toLocaleDateString("en-CA");

// postgres DATE strings are UTC midnight — appending T00:00:00 forces local parse
export function formatDate(dateStr) {
  const d = new Date(`${String(dateStr).slice(0, 10)}T00:00:00`);
  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString();
}
