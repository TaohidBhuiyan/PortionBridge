/**
 * resolveMediaUrl — turns a relative path returned by the upload API
 * (e.g. "profiles/abc123.jpg", stored as-is in the DB by
 * upload.service.js and returned as-is in API responses) into a URL the
 * browser can actually load.
 *
 * Found while auditing the profile-photo flow: the backend's own
 * getFileUrl() helper (services/upload.service.js) that builds
 * "/uploads/<path>" is defined but never called anywhere, so every
 * consumer — profile photos, donation images — was using the bare
 * relative path directly as an <img src>, which the browser resolves
 * against the *frontend's* current page URL, not the API server. Since
 * the frontend and backend are separate origins (VITE_API_BASE_URL vs.
 * the Vite dev server / static host), that never worked.
 *
 * This derives the backend's origin from the same VITE_API_BASE_URL env
 * var already used everywhere else (stripping the "/api/v1" suffix) —
 * no new configuration, no hardcoded localhost.
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';
const SERVER_ORIGIN = API_BASE.replace(/\/api\/v\d+\/?$/, '');

export function resolveMediaUrl(path) {
  if (!path) return null;
  const cleanPath = String(path).replace(/\\/g, '/');
  // Already a full URL (e.g. a Google-hosted profile picture) or a data URI
  if (/^(https?:)?\/\//.test(cleanPath) || cleanPath.startsWith('data:') || cleanPath.startsWith('blob:')) {
    return cleanPath;
  }
  const normalized = cleanPath.startsWith('/') ? cleanPath : `/uploads/${cleanPath}`;
  return `${SERVER_ORIGIN}${normalized}`;
}
