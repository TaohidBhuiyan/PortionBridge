import {
  Package,
  UserCheck,
  Calendar,
  Truck,
  CheckCircle,
  XCircle,
  MessageCircle,
  Star,
  RefreshCw,
  AlertTriangle,
  Users,
  Bell,
} from 'lucide-react';

// Every notification type the backend can actually emit
// (server/constants/index.js NOTIFICATION_TYPES), mapped to a lucide icon
// and a semantic tone. Types not explicitly listed fall back to a plain
// bell icon in a neutral tone rather than guessing.
const TYPE_META = {
  donation_created: { icon: Package, tone: 'primary' },
  donation_accepted: { icon: Package, tone: 'info' },
  volunteer_assigned: { icon: UserCheck, tone: 'info' },
  pickup_scheduled: { icon: Calendar, tone: 'warning' },
  volunteer_on_the_way: { icon: Truck, tone: 'info' },
  pickup_completed: { icon: CheckCircle, tone: 'success' },
  donation_cancelled: { icon: XCircle, tone: 'danger' },
  assignment_changed: { icon: UserCheck, tone: 'info' },
  new_message: { icon: MessageCircle, tone: 'primary' },
  status_updated: { icon: RefreshCw, tone: 'neutral' },
  rating_received: { icon: Star, tone: 'warning' },
  report_filed: { icon: AlertTriangle, tone: 'danger' },
  team_invitation_received: { icon: Users, tone: 'primary' },
  team_invitation_accepted: { icon: Users, tone: 'success' },
  team_member_joined: { icon: Users, tone: 'info' },
  team_member_left: { icon: Users, tone: 'neutral' },
  team_leadership_transferred: { icon: Users, tone: 'info' },
  team_member_promoted: { icon: Users, tone: 'success' },
  team_member_removed: { icon: Users, tone: 'danger' },
  team_announcement: { icon: Users, tone: 'primary' },
  team_donation_assigned: { icon: Package, tone: 'info' },
  team_donation_completed: { icon: CheckCircle, tone: 'success' },
};

const TONE_CLASSES = {
  primary: 'bg-dash-primary-soft text-dash-primary',
  info: 'bg-info-soft text-info',
  warning: 'bg-warning-soft text-warning',
  success: 'bg-success-soft text-success',
  danger: 'bg-danger-soft text-danger',
  neutral: 'bg-page border border-border text-text-secondary',
};

export function getNotificationMeta(type) {
  const meta = TYPE_META[type] || { icon: Bell, tone: 'neutral' };
  return { Icon: meta.icon, toneClass: TONE_CLASSES[meta.tone] };
}

// Only these types have a related_id that's confirmed to point at a
// donation (the notifications table has no related_type column to
// disambiguate, so this has to be inferred from type). Team/report/rating
// notifications are excluded since there's no confirmed frontend route for
// those entities — clicking them still marks as read, it just doesn't
// navigate anywhere invented.
const DONATION_ROUTE_TYPES = new Set([
  'donation_created',
  'donation_accepted',
  'volunteer_assigned',
  'pickup_scheduled',
  'volunteer_on_the_way',
  'pickup_completed',
  'donation_cancelled',
  'assignment_changed',
  'new_message',
  'status_updated',
  'rating_received',
  'team_donation_assigned',
  'team_donation_completed',
]);

export function getNotificationRoute(notification) {
  if (notification.related_id && DONATION_ROUTE_TYPES.has(notification.type)) {
    return `/donations/${notification.related_id}`;
  }
  // PHASE 4/5: all of these team_* types are confirmed (by reading
  // team.service.js directly) to actually fire today. The destination
  // page (/volunteer/team) doesn't need the ID to render — it fetches the
  // current user's team and pending invitations directly — so this route
  // is safe even for team_invitation_received, whose related_id is an
  // invitationId rather than a teamId (unlike the others below, which are
  // all teamId). Only team_member_joined was found to be unused
  // (team.service.js notifies the leader via team_invitation_accepted
  // instead when someone joins, which is already covered here), so it's
  // deliberately left out rather than added speculatively.
  const TEAM_ROUTE_TYPES = new Set([
    'team_announcement',
    'team_invitation_received',
    'team_invitation_accepted',
    'team_member_removed',
    'team_member_promoted',
    'team_leadership_transferred',
    'team_member_left',
  ]);
  if (notification.related_id && TEAM_ROUTE_TYPES.has(notification.type)) {
    return '/volunteer/team';
  }
  return null;
}

export function formatNotificationTimestamp(timestamp) {
  const now = new Date();
  const time = new Date(timestamp);
  const diffMs = now - time;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
