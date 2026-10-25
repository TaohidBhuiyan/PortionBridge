/**
 * Presentation helpers for the Disaster Relief UI. Pure functions only — no
 * network, no React — so the rules (coordinate validity, quantity progress,
 * query building) are unit-testable and shared by every relief component.
 *
 * Quantity semantics mirror the backend (server/utils/reliefQuantity.js):
 *   delivered            goods that reached the affected location
 *   activePledged        promised but NOT yet delivered (outstanding)
 *   remainingToPledge    still open for new pledges
 *   remainingUnfulfilled requested - delivered
 * Pledged goods are never counted as delivered.
 */

export const BANGLADESH_CENTER = [23.685, 90.3563];
export const BANGLADESH_ZOOM = 7;

export const DISASTER_TYPES = [
  { value: 'flood', label: 'Flood' },
  { value: 'flash_flood', label: 'Flash flood' },
  { value: 'fire', label: 'Fire' },
  { value: 'building_collapse', label: 'Building collapse' },
  { value: 'earthquake', label: 'Earthquake' },
  { value: 'cyclone', label: 'Cyclone' },
  { value: 'storm', label: 'Storm' },
  { value: 'other', label: 'Other emergency' },
];

export const SEVERITIES = [
  { value: 'low', label: 'Low' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export const INCIDENT_STATUS_LABELS = {
  reported: 'Reported',
  under_review: 'Under review',
  verified: 'Verified',
  active: 'Active',
  resolved: 'Resolved',
  rejected: 'Rejected',
  merged: 'Merged (duplicate)',
};

export const REQUEST_STATUS_LABELS = {
  pending_review: 'Pending review',
  approved: 'Open for pledges',
  rejected: 'Rejected',
  completed: 'Completed',
  cancelled: 'Cancelled',
  expired: 'Expired',
};

export const PRIORITY_LABELS = { low: 'Low', normal: 'Normal', high: 'High', urgent: 'Urgent' };

export const ITEM_CATEGORY_LABELS = {
  drinking_water: 'Drinking water',
  dry_food: 'Dry food',
  ready_to_eat_food: 'Ready-to-eat food',
  clothing: 'Clothing',
  blanket: 'Blankets',
  hygiene_kit: 'Hygiene kits',
  other: 'Other supplies',
};

export const SOURCE_TYPE_LABELS = {
  user_report: 'Community report',
  admin_entry: 'Entered by administrators',
  official_source: 'Official source',
  media: 'Media report',
  other: 'Other source',
};

export const STAGE_LABELS = {
  open: 'Open',
  partially_pledged: 'Partially pledged',
  fully_pledged: 'Fully pledged — awaiting delivery',
  partially_delivered: 'Partially delivered',
  fulfilled: 'Fulfilled',
  cancelled: 'Removed',
};

// unit -> [singular, plural]
const UNIT_LABELS = {
  piece: ['unit', 'units'],
  packet: ['packet', 'packets'],
  box: ['box', 'boxes'],
  set: ['set', 'sets'],
  kg: ['kg', 'kg'],
  liter: ['litre', 'litres'],
};

/** Marker/badge colours by severity (also used by the legend). */
export const SEVERITY_COLORS = {
  low: '#0ea5e9',
  moderate: '#d97706',
  high: '#ea580c',
  critical: '#dc2626',
};

export const labelFor = (map, key, fallback = 'Unavailable') => (key && map[key]) || fallback;

export function typeLabel(value) {
  const found = DISASTER_TYPES.find((t) => t.value === value);
  return found ? found.label : 'Unavailable';
}

/** finite number or null — anything else is treated as "backend did not provide it". */
export function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/** Valid map position: finite numbers in range and not the (0,0) "null island" placeholder. */
export function isValidCoordinate(lat, lng) {
  const la = toNumber(lat);
  const ln = toNumber(lng);
  if (la === null || ln === null) return false;
  if (la < -90 || la > 90 || ln < -180 || ln > 180) return false;
  if (la === 0 && ln === 0) return false;
  return true;
}

export const hasMapLocation = (incident) => Boolean(incident) && isValidCoordinate(incident.latitude, incident.longitude);

export function haversineKm(a, b) {
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

const SEVERITY_RANK = { critical: 4, high: 3, moderate: 2, low: 1 };

/**
 * Public coordinates are approximate (rounded server-side), so several incidents
 * in one district can share exactly the same position. Rather than nudging them
 * to fake positions, incidents at the same position are grouped so the map can
 * show ONE marker (with a count) whose popup lists every incident there.
 * Within a group, the most severe incident comes first.
 * Input: [{ incident, lat, lng }]  ->  Output: [{ lat, lng, incidents: [incident, …] }]
 */
export function groupByPosition(points) {
  const groups = new Map();
  points.forEach(({ incident, lat, lng }) => {
    const key = `${lat.toFixed(5)},${lng.toFixed(5)}`;
    if (!groups.has(key)) groups.set(key, { lat, lng, incidents: [] });
    groups.get(key).incidents.push(incident);
  });
  return [...groups.values()].map((g) => ({
    ...g,
    incidents: g.incidents.sort((x, y) => (SEVERITY_RANK[y.severity] || 0) - (SEVERITY_RANK[x.severity] || 0) || x.id - y.id),
  }));
}

// ---- query building -------------------------------------------------------

export const SCOPE_OPTIONS = {
  open: { label: 'Active & verified', status: 'verified,active' },
  resolved: { label: 'Resolved', status: 'resolved' },
  all: { label: 'All visible', status: '' },
  unverified: { label: 'Unverified reports', status: 'reported,under_review', adminOnly: true },
  rejected: { label: 'Rejected', status: 'rejected', adminOnly: true },
};

export const DEFAULT_FILTERS = {
  search: '', scope: 'open', disasterType: '', severity: '', district: '', mine: false,
};

export function buildIncidentParams(filters, { page = 1, limit = 25 } = {}) {
  const params = { page, limit };
  const scope = SCOPE_OPTIONS[filters.scope] || SCOPE_OPTIONS.open;
  if (scope.status) params.status = scope.status;
  if (filters.search && filters.search.trim()) params.search = filters.search.trim().slice(0, 100);
  if (filters.disasterType) params.disasterType = filters.disasterType;
  if (filters.severity) params.severity = filters.severity;
  if (filters.district) params.district = filters.district;
  if (filters.mine) params.mine = 'true';
  return params;
}

export function countActiveFilters(filters) {
  return ['search', 'disasterType', 'severity', 'district'].filter((k) => Boolean(filters[k] && String(filters[k]).trim())).length
    + (filters.scope !== 'open' ? 1 : 0) + (filters.mine ? 1 : 0);
}

// ---- quantities -----------------------------------------------------------

export function formatQuantity(value, unit) {
  const n = toNumber(value);
  if (n === null) return 'Unavailable';
  const text = n.toLocaleString('en-US', { maximumFractionDigits: 3 });
  const names = UNIT_LABELS[unit];
  if (!names) return text;
  return `${text} ${n === 1 ? names[0] : names[1]}`;
}

/**
 * Progress bar segments as % of the requirement. `delivered` is solid,
 * `pledged` (outstanding, not yet delivered) is lighter, the rest is open.
 * Returns null when the requirement itself is unavailable or not positive.
 */
export function computeProgress(quantities) {
  const requested = toNumber(quantities?.requested);
  if (requested === null || requested <= 0) return null;
  const delivered = toNumber(quantities?.delivered) ?? 0;
  const pledged = toNumber(quantities?.activePledged) ?? 0;
  const clamp = (v) => Math.max(0, Math.min(100, v));
  const deliveredPct = clamp((delivered / requested) * 100);
  const pledgedPct = clamp(Math.min((pledged / requested) * 100, 100 - deliveredPct));
  return {
    deliveredPct,
    pledgedPct,
    openPct: clamp(100 - deliveredPct - pledgedPct),
  };
}

// ---- text / dates / links -------------------------------------------------

export function formatDateTime(value) {
  if (!value) return 'Unavailable';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Unavailable';
  return new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(d);
}

/** Only http(s) URLs may become links — blocks javascript:/data: schemes from user-supplied references. */
export function safeHttpUrl(value) {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

/** Extracts a human message from an axios error without leaking internals. */
export function apiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const status = error?.response?.status;
  if (status === 404) return 'This record could not be found. It may not be public yet, or it was removed.';
  if (status === 401) return 'Your session has expired. Please sign in again.';
  if (status === 403) return 'You do not have permission to view this.';
  if (status === 429) return 'Too many requests. Please wait a moment and try again.';
  const message = error?.response?.data?.message;
  return typeof message === 'string' && message.length < 200 ? message : fallback;
}

// ---- Phase 3: pledges, tasks and reports -----------------------------------

export const TASK_STATUS_LABELS = {
  available: 'Waiting for a volunteer',
  accepted: 'Volunteer assigned',
  scheduled: 'Pickup scheduled',
  on_the_way: 'Volunteer on the way',
  picked_up: 'Picked up — awaiting delivery',
  delivery_reported: 'Delivery reported — awaiting verification',
  completed: 'Delivered and verified',
  completed_partial: 'Partially delivered and verified',
  failed: 'Delivery failed',
  cancelled: 'Cancelled',
};

export const PLEDGE_STATUS_LABELS = {
  pledged: 'Pledged',
  collected: 'Collected',
  delivered: 'Delivered',
  partially_fulfilled: 'Partially fulfilled',
  cancelled: 'Cancelled',
  failed: 'Failed',
};

export const REPORT_TYPE_LABELS = {
  pickup: 'Pickup confirmed',
  delivery: 'Delivery reported',
  failed_delivery: 'Failed delivery',
  problem: 'Problem reported',
  release: 'Task released',
};

export const REPORT_STATUS_LABELS = {
  recorded: 'Recorded', pending: 'Awaiting verification', verified: 'Verified', rejected: 'Not accepted', open: 'Open', resolved: 'Resolved',
};

export const TIME_SLOTS = [
  { value: 'morning', label: 'Morning (9 AM – 12 PM)' },
  { value: 'afternoon', label: 'Afternoon (12 – 5 PM)' },
  { value: 'evening', label: 'Evening (5 – 8 PM)' },
];

/** A task that can still change (used to decide which actions to offer). */
export const ACTIVE_TASK_STATUSES = ['available', 'accepted', 'scheduled', 'on_the_way', 'picked_up', 'delivery_reported'];

/** A fresh idempotency key per pledge ATTEMPT: reused for retries of the same attempt, replaced when the form changes. */
export function newIdempotencyKey() {
  const rnd = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '') : `${Date.now()}${Math.random().toString(36).slice(2)}`;
  return `pledge-${rnd}`.slice(0, 64);
}

/**
 * Client-side quantity sanity check. It only avoids a pointless round trip: the server re-validates
 * every rule and is the only authority on what is still available.
 */
export function validatePledgeQuantity(raw, { unit, remainingToPledge }) {
  const text = String(raw ?? '').trim();
  if (!text) return 'Enter a quantity.';
  if (!/^\d{1,9}(\.\d{1,3})?$/.test(text)) return 'Enter a positive number with at most 3 decimals.';
  const n = Number(text);
  if (!(n > 0)) return 'Quantity must be greater than zero.';
  if (unit !== 'kg' && unit !== 'liter' && !Number.isInteger(n)) return 'This item is counted in whole numbers.';
  const left = toNumber(remainingToPledge);
  if (left !== null && n > left) return `Only ${left.toLocaleString('en-US', { maximumFractionDigits: 3 })} is still needed.`;
  return null;
}
