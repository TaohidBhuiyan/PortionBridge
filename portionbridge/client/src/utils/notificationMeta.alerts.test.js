import { describe, it, expect } from 'vitest';
import { getNotificationMeta, getNotificationRoute, ALERT_SEVERITY_LABELS } from './notificationMeta';

describe('notificationMeta — disaster alerts (Phase 4)', () => {
  it('links an alert to its incident page', () => {
    expect(getNotificationRoute({ type: 'disaster_alert', incident_id: 12, related_id: 12 }, 'donor')).toBe('/relief/incidents/12');
  });
  it('prefers the relief request when the alert is a relief update', () => {
    expect(getNotificationRoute({ type: 'disaster_alert', incident_id: 12, relief_request_id: 40 }, 'volunteer')).toBe('/relief/requests/40');
  });
  it('links a relief task / pledge notice by role', () => {
    const n = { type: 'status_updated', relief_pledge_id: 7, incident_id: 3 };
    expect(getNotificationRoute(n, 'volunteer')).toBe('/volunteer/relief-tasks/7');
    expect(getNotificationRoute(n, 'donor')).toBe('/donor/relief-pledges/7');
  });
  it('leaves existing donation / support routing untouched', () => {
    expect(getNotificationRoute({ type: 'donation_accepted', related_id: 5 })).toBe('/donations/5');
    expect(getNotificationRoute({ type: 'support_ticket_reply', related_id: 9 }, 'admin')).toBe('/admin/support/9');
    expect(getNotificationRoute({ type: 'new_message', related_id: null })).toBeNull();
  });
  it('tone follows the alert severity and labels reuse the incident severity names', () => {
    expect(getNotificationMeta('disaster_alert', 'critical').toneClass).toMatch(/danger/);
    expect(getNotificationMeta('disaster_alert', 'low').toneClass).toMatch(/info/);
    expect(getNotificationMeta('donation_created').toneClass).toMatch(/dash-primary/);
    expect(ALERT_SEVERITY_LABELS.critical).toBe('Critical emergency');
  });
});
