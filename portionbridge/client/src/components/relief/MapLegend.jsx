import { iconForType } from '../../utils/reliefIcons';
import { DISASTER_TYPES, SEVERITIES, SEVERITY_COLORS } from '../../utils/relief';

function Swatch({ className = '', style }) {
  return <span aria-hidden="true" className={`inline-block h-4 w-4 rounded-full border-2 border-white shadow ring-1 ring-border ${className}`} style={style} />;
}

/** Explains the marker styling used by DisasterMap (colour = severity, icon = type, outline/fade = status). */
export function MapLegend({ showUnverified = false }) {
  return (
    <section aria-label="Map legend" className="rounded-2xl border border-border bg-surface p-4 text-xs text-text-secondary">
      <h3 className="mb-3 text-sm font-semibold text-text-primary">Legend</h3>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <p className="mb-1.5 font-semibold text-text-primary">Colour = severity</p>
          <ul className="space-y-1">
            {SEVERITIES.map((s) => (
              <li key={s.value} className="flex items-center gap-2"><Swatch style={{ background: SEVERITY_COLORS[s.value] }} />{s.label}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-1.5 font-semibold text-text-primary">Icon = disaster type</p>
          <ul className="grid grid-cols-2 gap-1">
            {DISASTER_TYPES.map((t) => {
              const Icon = iconForType(t.value);
              return <li key={t.value} className="flex items-center gap-1.5"><Icon size={14} aria-hidden="true" className="text-dash-primary" />{t.label}</li>;
            })}
          </ul>
        </div>
        <div>
          <p className="mb-1.5 font-semibold text-text-primary">Outline = status</p>
          <ul className="space-y-1">
            <li className="flex items-center gap-2"><Swatch style={{ background: '#64748b' }} />Verified / active (solid)</li>
            <li className="flex items-center gap-2"><Swatch style={{ background: '#64748b', opacity: 0.55 }} />Resolved (faded)</li>
            {showUnverified && <li className="flex items-center gap-2"><Swatch className="!border-dashed" style={{ background: '#64748b' }} />Not verified (dashed)</li>}
            <li className="flex items-center gap-2"><Swatch style={{ background: '#0284c7' }} />Your location (Nearby mode)</li>
          </ul>
          <p className="mt-2 text-text-muted">Map positions are approximate (about 1 km).</p>
        </div>
      </div>
    </section>
  );
}
