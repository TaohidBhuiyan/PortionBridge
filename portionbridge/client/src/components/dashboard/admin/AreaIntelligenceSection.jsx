import { MapPin, AlertTriangle, TrendingUp, Clock, Truck, CheckCircle2 } from 'lucide-react';
import { SkeletonCard } from '../skeletons';
import { EmptyState } from '../EmptyState';

const SEVERITY_TONE = {
  high: 'bg-danger-soft text-danger border-danger/30',
  medium: 'bg-warning-soft text-warning border-warning/30',
};

/**
 * AreaIntelligenceSection — Phase 9's per-area operational metrics and
 * transparent, rule-based bottleneck insights (e.g. "Mirpur has high
 * donation demand but comparatively low volunteer availability").
 *
 * `data` is the object returned by GET /admin/area-intelligence
 * (admin.service.js#getAreaIntelligence) — { areas, insights,
 * generatedAt }. Every number here is real: `area` comes from donors'
 * own saved_addresses.area field, `volunteerAvailability` from
 * volunteers' own declared service_areas. No external service, no ML —
 * insights are template strings filled from real aggregates compared
 * against the platform-wide average.
 */
export function AreaIntelligenceSection({ data, loading }) {
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="bg-surface rounded-lg border border-border/50 p-5">
          <SkeletonCard count={3} />
        </div>
      </div>
    );
  }

  const areas = data?.areas || [];
  const insights = data?.insights || [];

  if (areas.length === 0) {
    return (
      <EmptyState
        icon={MapPin}
        title="No area data yet"
        description="Area intelligence needs donations placed against a saved pickup address with an area filled in."
        showAction={false}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Insights */}
      <div className="bg-surface rounded-lg border border-border/50 p-5">
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={15} className="text-dash-primary" />
          <h3 className="text-sm font-semibold text-text-primary">Bottleneck Insights</h3>
        </div>
        {insights.length === 0 ? (
          <p className="text-xs text-text-secondary flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-success" /> No operational bottlenecks detected right now.
          </p>
        ) : (
          <ul className="space-y-2">
            {insights.map((insight, i) => (
              <li
                key={i}
                className={`text-xs px-3 py-2 rounded-lg border ${SEVERITY_TONE[insight.severity] || SEVERITY_TONE.medium}`}
              >
                {insight.message}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Per-area table */}
      <div className="bg-surface rounded-lg border border-border/50 overflow-hidden">
        <div className="px-5 pt-5 pb-3">
          <h3 className="text-sm font-semibold text-text-primary">Area Metrics</h3>
          <p className="text-xs text-text-secondary mt-0.5">Busiest areas first, based on donations with a saved pickup address.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border/50">
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary">Area</th>
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary">
                  <span className="inline-flex items-center gap-1"><TrendingUp size={12} /> Demand</span>
                </th>
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary">Volunteers</th>
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary">
                  <span className="inline-flex items-center gap-1"><Clock size={12} /> Pickup Delays</span>
                </th>
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary">
                  <span className="inline-flex items-center gap-1"><Truck size={12} /> Delivery Delays</span>
                </th>
                <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary">Completion</th>
              </tr>
            </thead>
            <tbody>
              {areas.map((a) => (
                <tr key={a.area} className="border-b border-border/50 last:border-0">
                  <td className="py-2.5 px-4 text-xs font-medium text-text-primary">{a.area}</td>
                  <td className="py-2.5 px-4 text-xs text-text-secondary">{a.donationDemand}</td>
                  <td className="py-2.5 px-4 text-xs text-text-secondary">{a.volunteerAvailability}</td>
                  <td className="py-2.5 px-4 text-xs text-text-secondary">{a.delayedPickups}</td>
                  <td className="py-2.5 px-4 text-xs text-text-secondary">{a.delayedDeliveries}</td>
                  <td className="py-2.5 px-4 text-xs text-text-secondary">
                    {a.completionRate !== null ? `${a.completionRate}%` : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
