import { useEffect, useState } from 'react';
import { Siren } from 'lucide-react';
import alertApi from '../../services/alertApi';
import { ALERT_SEVERITY_LABELS } from '../../utils/notificationMeta';
import { formatDateTime } from '../../utils/relief';

/**
 * Shows the live alert for an incident (if an administrator issued one). Purely informational and
 * failure-tolerant: if the alert lookup fails the incident page renders exactly as before.
 */
export function ActiveAlertBanner({ incidentId }) {
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await alertApi.listActive({ incidentId });
        if (!cancelled) setAlert(res?.data?.alerts?.[0] ?? null);
      } catch {
        if (!cancelled) setAlert(null);
      }
    })();
    return () => { cancelled = true; };
  }, [incidentId]);

  if (!alert) return null;
  return (
    <section aria-label="Active alert" data-testid="active-alert-banner" className="flex gap-3 rounded-2xl border border-warning/40 bg-warning-soft p-4">
      <Siren size={20} className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
      <div className="text-sm">
        <p className="font-semibold text-text-primary">
          {ALERT_SEVERITY_LABELS[alert.severity]} · {alert.scope === 'nationwide' ? 'Nationwide alert' : alert.scope === 'regional' ? 'Regional alert' : 'Local alert'}
        </p>
        {alert.adminNote && <p className="mt-0.5 text-xs text-text-secondary">{alert.adminNote}</p>}
        <p className="mt-0.5 text-xs text-text-muted">Alert last updated {formatDateTime(alert.updatedAt)}. Approved relief needs below show current quantities.</p>
      </div>
    </section>
  );
}

export default ActiveAlertBanner;
