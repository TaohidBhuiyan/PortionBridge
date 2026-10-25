const { RELIEF } = require('../constants');

/**
 * Pure builders for alert notification wording. They only ever read the incident /
 * alert / relief records they are given — nothing is estimated or invented. Wording is
 * deliberately sober: severity is shown with the project's own labels, the incident
 * status comes straight from the record, and no text implies that donations or volunteers
 * are already available.
 */

const TYPE_LABELS = {
  flood: 'Flood',
  flash_flood: 'Flash flood',
  fire: 'Fire',
  building_collapse: 'Building collapse',
  earthquake: 'Earthquake',
  cyclone: 'Cyclone',
  storm: 'Severe storm',
  other: 'Emergency',
};

const STATUS_LABELS = {
  verified: 'Verified',
  active: 'Active',
  resolved: 'Resolved',
  reported: 'Reported (not verified)',
  under_review: 'Under review (not verified)',
  rejected: 'Rejected',
};

const EVENT_PREFIX = {
  issued: '',
  updated: 'Update: ',
  escalated: 'Escalated: ',
  area_expanded: 'Wider area: ',
  relief_update: 'Relief update: ',
  correction: 'Correction: ',
  resolved: 'Resolved: ',
  cancelled: 'Alert withdrawn: ',
};

const typeLabel = (type) => TYPE_LABELS[type] || TYPE_LABELS.other;
const severityLabel = (severity) => RELIEF.ALERT.SEVERITY_LABELS[severity] || RELIEF.ALERT.SEVERITY_LABELS.moderate;

function clip(text, max) {
  const t = String(text ?? '').replace(/\s+/g, ' ').trim();
  return t.length <= max ? t : `${t.slice(0, max - 1).trimEnd()}…`;
}

function formatQuantity(n, unit) {
  const value = Number.isInteger(n) ? String(n) : String(Number(n.toFixed(3)));
  return `${value} ${unit}`;
}

/** "Water: 500 packet requested, 320 still needed" — numbers come from the authoritative totals. */
function reliefLine(request, items = []) {
  if (!request) return '';
  const parts = items.slice(0, 3).map((i) => {
    const q = i.quantities;
    return `${i.name}: ${formatQuantity(q.requested, i.unit)} requested, ${formatQuantity(q.remainingToPledge, i.unit)} still needed`;
  });
  if (!parts.length) return `Approved relief request: ${request.title}.`;
  const more = items.length > 3 ? ` (+${items.length - 3} more)` : '';
  return `Approved relief request "${request.title}" — ${parts.join('; ')}${more}.`;
}

/**
 * @param {Object} ctx
 * @param {Object} ctx.event     disaster_alert_events row
 * @param {Object} ctx.alert     disaster_alerts row
 * @param {Object} ctx.incident  disaster_incidents row (live)
 * @param {Object} [ctx.request] relief request row for relief_update events (live)
 * @param {Array}  [ctx.items]   serialized items of that request (live quantities)
 * @param {number} [ctx.approvedRequestCount] approved relief requests currently open on the incident
 * @returns {{ title: string, message: string }} title <= 150 chars, message <= 500 chars (column limits)
 */
function buildAlertContent({ event, alert, incident, request = null, items = [], approvedRequestCount = 0 }) {
  const sev = event.severity || alert.severity;
  const place = incident.affected_area ? `${incident.district} (${incident.affected_area})` : incident.district;
  const prefix = EVENT_PREFIX[event.event_type] || '';
  const title = clip(`${prefix}${severityLabel(sev)} — ${typeLabel(incident.disaster_type)} in ${incident.district}`, 150);

  const lines = [];
  const status = STATUS_LABELS[incident.status] || incident.status;

  switch (event.event_type) {
    case 'resolved':
      lines.push(`${typeLabel(incident.disaster_type)} in ${place} has been marked resolved.`);
      break;
    case 'cancelled':
      lines.push(`An earlier alert about ${typeLabel(incident.disaster_type).toLowerCase()} in ${place} was withdrawn by an administrator.`);
      break;
    case 'correction':
      lines.push(`Correction regarding the ${typeLabel(incident.disaster_type).toLowerCase()} alert for ${place}.`);
      break;
    default:
      lines.push(`Verified incident: ${typeLabel(incident.disaster_type).toLowerCase()} in ${place}. Status: ${status}.`);
  }

  if (event.note) lines.push(event.note);
  if (event.event_type === 'relief_update') {
    const line = reliefLine(request, items);
    if (line) lines.push(line);
  } else if (['issued', 'updated', 'escalated', 'area_expanded'].includes(event.event_type) && approvedRequestCount > 0) {
    lines.push(`${approvedRequestCount} approved relief request${approvedRequestCount === 1 ? ' is' : 's are'} open for pledges.`);
  }
  if (!['resolved', 'cancelled'].includes(event.event_type)) {
    lines.push('Details may change as the situation develops; check the incident page for the latest status.');
  }

  return { title, message: clip(lines.join(' '), 500) };
}

module.exports = { buildAlertContent, typeLabel, severityLabel, STATUS_LABELS, TYPE_LABELS };
