import { ShieldCheck, ShieldAlert, ShieldQuestion } from 'lucide-react';

const RISK_CONFIG = {
  low: { icon: ShieldCheck, label: 'Low Risk', tone: 'bg-success-soft text-success' },
  medium: { icon: ShieldQuestion, label: 'Medium Risk', tone: 'bg-warning-soft text-warning' },
  high: { icon: ShieldAlert, label: 'High Risk', tone: 'bg-danger-soft text-danger' },
};

/**
 * HealthScoreCard — Phase 7's transparent, rule-based Donation Health
 * Score. `healthScore` is the object returned by
 * admin.service.js#getDonationDetail (utils/donationHealthScore.js on the
 * backend) — { score, riskLevel, reasons: [{label, impact}] }. Every
 * reason traces to a specific real signal (donor verification, scheduling,
 * delays, reports, volunteer presence) — no external AI, no black box.
 */
export function HealthScoreCard({ healthScore }) {
  if (!healthScore) return null;

  const { score, riskLevel, reasons } = healthScore;
  const config = RISK_CONFIG[riskLevel] || RISK_CONFIG.medium;
  const Icon = config.icon;

  return (
    <div className="bg-surface rounded-lg border border-border/50 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Donation Health</h3>
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.tone}`}>
          <Icon size={13} /> {config.label}
        </span>
      </div>

      <div className="flex items-end gap-2 mb-3">
        <p className="text-3xl font-bold text-text-primary leading-none">{score}</p>
        <p className="text-sm text-text-secondary mb-0.5">/ 100</p>
      </div>

      <ul className="space-y-1.5">
        {reasons.map((reason, i) => (
          <li key={i} className="flex items-center justify-between text-xs">
            <span className="text-text-secondary">{reason.label}</span>
            {reason.impact !== 0 && (
              <span className="text-danger font-medium shrink-0 ml-2">{reason.impact}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}