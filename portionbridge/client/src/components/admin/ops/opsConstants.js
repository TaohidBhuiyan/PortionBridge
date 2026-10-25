// Shared class names, tone maps and filter defaults for the admin operations screens.
export const btn = 'rounded-xl border border-border bg-surface px-3 py-1.5 text-sm font-semibold text-text-primary hover:bg-surface-hover disabled:opacity-60';
export const primaryBtn = 'rounded-xl bg-dash-primary px-4 py-2 text-sm font-semibold text-white hover:bg-dash-primary-hover disabled:opacity-60';
export const dangerBtn = 'rounded-xl bg-danger px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60';
export const field = 'mt-1 w-full rounded-xl border border-border bg-page px-3 py-2 text-sm text-text-primary';
export const SEVERITY_TONE = { low: 'info', moderate: 'warning', high: 'danger', critical: 'danger' };
export const STATUS_TONE = {
  reported: 'warning', under_review: 'warning', verified: 'success', active: 'success', resolved: 'neutral', rejected: 'danger', merged: 'neutral',
  pending_review: 'warning', approved: 'success', completed: 'info', cancelled: 'neutral', expired: 'neutral',
  pledged: 'info', collected: 'info', delivered: 'success', partially_fulfilled: 'warning', failed: 'danger',
};
export const DIVISION_NAMES = ['Barishal', 'Chattogram', 'Dhaka', 'Khulna', 'Mymensingh', 'Rajshahi', 'Rangpur', 'Sylhet'];
export const EMPTY_FILTERS = { disasterType: '', status: '', severity: '', verificationStatus: '', division: '', district: '', requestStatus: '', from: '', to: '' };
