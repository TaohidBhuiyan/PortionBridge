/**
 * Escapes a value for safe interpolation into an HTML string. Needed
 * because Leaflet's bindPopup() renders its string argument as raw HTML
 * (no built-in escaping) — unlike JSX, which escapes by default. Any
 * user-controlled field (volunteer/team/donor names, addresses, etc.)
 * going into a Leaflet popup string must go through this first.
 */
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}
