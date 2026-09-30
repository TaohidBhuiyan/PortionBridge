/** Small helpers shared by the analytics charts. */

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/** 'YYYY-MM' -> 'Sep' */
export function shortMonth(key) {
  const m = Number(String(key).slice(5, 7));
  return MONTHS_SHORT[m - 1] || String(key);
}

/** 'YYYY-MM' -> 'September 2026' */
export function fullMonth(key) {
  const m = Number(String(key).slice(5, 7));
  const y = String(key).slice(0, 4);
  return MONTHS_FULL[m - 1] ? `${MONTHS_FULL[m - 1]} ${y}` : String(key);
}
