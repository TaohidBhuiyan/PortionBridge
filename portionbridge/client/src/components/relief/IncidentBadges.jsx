import { ShieldCheck, ShieldQuestion } from 'lucide-react';
import { TYPE_ICONS } from '../../utils/reliefIcons';
import {
  INCIDENT_STATUS_LABELS, REQUEST_STATUS_LABELS, PRIORITY_LABELS, STAGE_LABELS, SEVERITIES,
  typeLabel, labelFor,
} from '../../utils/relief';

const base = 'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap';

const SEVERITY_CLASS = {
  low: 'bg-info-soft text-info',
  moderate: 'bg-warning-soft text-warning',
  high: 'bg-danger-soft text-danger',
  critical: 'bg-danger text-white',
};

export function SeverityBadge({ severity }) {
  const label = SEVERITIES.find((s) => s.value === severity)?.label;
  if (!label) return null;
  return <span className={`${base} ${SEVERITY_CLASS[severity]}`}>{label} severity</span>;
}

export function TypeBadge({ type }) {
  const Icon = TYPE_ICONS[type] ?? TYPE_ICONS.other;
  return (
    <span className={`${base} bg-dash-primary-soft text-dash-primary`}>
      <Icon size={12} aria-hidden="true" />
      {typeLabel(type)}
    </span>
  );
}

const STATUS_CLASS = {
  verified: 'bg-success-soft text-success',
  active: 'bg-success-soft text-success',
  resolved: 'bg-surface-hover text-text-secondary',
  reported: 'bg-warning-soft text-warning',
  under_review: 'bg-warning-soft text-warning',
  rejected: 'bg-danger-soft text-danger',
};

export function IncidentStatusBadge({ status, isVerified }) {
  // The Verification badge already says "Verified"; don't repeat it for the plain 'verified' status.
  if (status === 'verified' && isVerified === true) return null;
  return <span className={`${base} ${STATUS_CLASS[status] || 'bg-surface-hover text-text-secondary'}`}>{labelFor(INCIDENT_STATUS_LABELS, status)}</span>;
}

/**
 * "Verified" is shown ONLY when the backend says so (isVerified === true).
 * Anything else is explicitly labelled as not verified.
 */
export function VerificationBadge({ isVerified }) {
  if (isVerified === true) {
    return (
      <span className={`${base} bg-success-soft text-success`}>
        <ShieldCheck size={12} aria-hidden="true" /> Verified
      </span>
    );
  }
  return (
    <span className={`${base} bg-warning-soft text-warning`}>
      <ShieldQuestion size={12} aria-hidden="true" /> Not verified
    </span>
  );
}

const REQUEST_STATUS_CLASS = {
  approved: 'bg-success-soft text-success',
  completed: 'bg-info-soft text-info',
  pending_review: 'bg-warning-soft text-warning',
  rejected: 'bg-danger-soft text-danger',
  cancelled: 'bg-surface-hover text-text-secondary',
  expired: 'bg-surface-hover text-text-secondary',
};

export function RequestStatusBadge({ status, isExpired }) {
  if (isExpired && status === 'approved') {
    return <span className={`${base} bg-surface-hover text-text-secondary`}>Expired</span>;
  }
  return <span className={`${base} ${REQUEST_STATUS_CLASS[status] || 'bg-surface-hover text-text-secondary'}`}>{labelFor(REQUEST_STATUS_LABELS, status)}</span>;
}

const PRIORITY_CLASS = {
  low: 'bg-surface-hover text-text-secondary',
  normal: 'bg-info-soft text-info',
  high: 'bg-warning-soft text-warning',
  urgent: 'bg-danger-soft text-danger',
};

export function PriorityBadge({ priority }) {
  if (!priority) return null;
  return <span className={`${base} ${PRIORITY_CLASS[priority] || PRIORITY_CLASS.normal}`}>{labelFor(PRIORITY_LABELS, priority)} priority</span>;
}

const STAGE_CLASS = {
  open: 'bg-surface-hover text-text-secondary',
  partially_pledged: 'bg-info-soft text-info',
  fully_pledged: 'bg-warning-soft text-warning',
  partially_delivered: 'bg-info-soft text-info',
  fulfilled: 'bg-success-soft text-success',
  cancelled: 'bg-surface-hover text-text-secondary',
};

export function StageBadge({ stage }) {
  if (!stage) return null;
  return <span className={`${base} ${STAGE_CLASS[stage] || STAGE_CLASS.open}`}>{labelFor(STAGE_LABELS, stage)}</span>;
}
