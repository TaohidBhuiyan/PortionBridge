import { TASK_STATUS_LABELS, PLEDGE_STATUS_LABELS, REPORT_TYPE_LABELS, REPORT_STATUS_LABELS, labelFor } from '../../utils/relief';

const base = 'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap';

const TASK_TONE = {
  available: 'bg-surface-hover text-text-secondary',
  accepted: 'bg-info-soft text-info',
  scheduled: 'bg-info-soft text-info',
  on_the_way: 'bg-info-soft text-info',
  picked_up: 'bg-warning-soft text-warning',
  delivery_reported: 'bg-warning-soft text-warning',
  completed: 'bg-success-soft text-success',
  completed_partial: 'bg-success-soft text-success',
  failed: 'bg-danger-soft text-danger',
  cancelled: 'bg-surface-hover text-text-secondary',
};

/** Where the pledge's pickup/delivery task is — never says "delivered" until the server says it is verified. */
export function TaskStatusBadge({ status }) {
  if (!status) return null;
  return <span className={`${base} ${TASK_TONE[status] || TASK_TONE.available}`}>{labelFor(TASK_STATUS_LABELS, status)}</span>;
}

const PLEDGE_TONE = {
  pledged: 'bg-info-soft text-info',
  collected: 'bg-warning-soft text-warning',
  delivered: 'bg-success-soft text-success',
  partially_fulfilled: 'bg-success-soft text-success',
  cancelled: 'bg-surface-hover text-text-secondary',
  failed: 'bg-danger-soft text-danger',
};

export function PledgeStatusBadge({ status }) {
  if (!status) return null;
  return <span className={`${base} ${PLEDGE_TONE[status] || PLEDGE_TONE.pledged}`}>{labelFor(PLEDGE_STATUS_LABELS, status)}</span>;
}

const REPORT_TONE = {
  recorded: 'bg-surface-hover text-text-secondary',
  pending: 'bg-warning-soft text-warning',
  verified: 'bg-success-soft text-success',
  rejected: 'bg-danger-soft text-danger',
  open: 'bg-danger-soft text-danger',
  resolved: 'bg-surface-hover text-text-secondary',
};

export function ReportStatusBadge({ status }) {
  if (!status) return null;
  return <span className={`${base} ${REPORT_TONE[status] || REPORT_TONE.recorded}`}>{labelFor(REPORT_STATUS_LABELS, status)}</span>;
}

export function ReportTypeLabel({ type }) {
  return <span>{labelFor(REPORT_TYPE_LABELS, type, 'Report')}</span>;
}
