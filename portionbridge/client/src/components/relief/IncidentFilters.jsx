import { useEffect, useRef, useState } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { BD_DISTRICTS } from '../../utils/bdDistricts';
import { DISASTER_TYPES, SEVERITIES, SCOPE_OPTIONS, countActiveFilters } from '../../utils/relief';

const control = 'w-full rounded-xl border border-border bg-input px-3 py-2 text-sm text-text-primary focus:border-border-focus focus:outline-none focus:ring-2 focus:ring-dash-primary/30';
const labelClass = 'mb-1 block text-xs font-semibold text-text-secondary';

/**
 * Filter bar for the incident list/map. `onChange` receives a partial filters
 * object. Keyword search is debounced here so typing does not fire a request per key.
 * Admin-only scopes (unverified/rejected) are only offered when `isAdmin` is true;
 * the backend enforces the same rule, so this is a convenience, not the security check.
 */
export function IncidentFilters({ filters, onChange, onClear, isAdmin = false, resetKey = 0 }) {
  const timer = useRef(null);
  const [open, setOpen] = useState(false); // small screens only: filters start collapsed so the map/list is visible first
  useEffect(() => () => clearTimeout(timer.current), []);

  const handleSearch = (event) => {
    const value = event.target.value;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange({ search: value }), 400);
  };

  const scopes = Object.entries(SCOPE_OPTIONS).filter(([, s]) => !s.adminOnly || isAdmin);
  const activeCount = countActiveFilters(filters);

  return (
    <section aria-label="Filter disasters" className="rounded-2xl border border-border bg-surface p-4">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="relief-filter-panel"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 text-sm font-semibold text-text-primary lg:hidden"
      >
        <span className="inline-flex items-center gap-2"><SlidersHorizontal size={16} aria-hidden="true" />Search &amp; filters</span>
        <span className="text-xs font-medium text-text-secondary">{activeCount > 0 ? `${activeCount} active · ` : ''}{open ? 'Hide' : 'Show'}</span>
      </button>
      <div id="relief-filter-panel" className={`${open ? 'mt-3 block' : 'hidden'} lg:mt-0 lg:block`}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <div className="sm:col-span-2 lg:col-span-2">
          <label htmlFor="relief-search" className={labelClass}>Search</label>
          <div className="relative">
            <Search size={16} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              id="relief-search"
              key={resetKey}
              type="search"
              defaultValue={filters.search}
              onChange={handleSearch}
              maxLength={100}
              placeholder="Title, district or affected area"
              className={`${control} pl-9`}
            />
          </div>
        </div>

        <div>
          <label htmlFor="relief-district" className={labelClass}>District</label>
          <select id="relief-district" value={filters.district} onChange={(e) => onChange({ district: e.target.value })} className={control}>
            <option value="">All districts</option>
            {BD_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="relief-type" className={labelClass}>Disaster type</label>
          <select id="relief-type" value={filters.disasterType} onChange={(e) => onChange({ disasterType: e.target.value })} className={control}>
            <option value="">All types</option>
            {DISASTER_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="relief-severity" className={labelClass}>Severity</label>
          <select id="relief-severity" value={filters.severity} onChange={(e) => onChange({ severity: e.target.value })} className={control}>
            <option value="">Any severity</option>
            {SEVERITIES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="relief-scope" className={labelClass}>Status</label>
          <select id="relief-scope" value={filters.scope} onChange={(e) => onChange({ scope: e.target.value })} className={control}>
            {scopes.map(([value, s]) => <option key={value} value={value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-3 text-xs text-text-secondary">
          {isAdmin ? (
            <span>Administrators can review unverified reports using the Status filter.</span>
          ) : (
            <>
              <span>Only administrator-verified incidents are listed publicly.</span>
              <label className="inline-flex cursor-pointer items-center gap-1.5 font-medium text-text-primary">
                <input type="checkbox" checked={filters.mine} onChange={(e) => onChange({ mine: e.target.checked, scope: e.target.checked ? 'all' : 'open' })} className="h-4 w-4 rounded border-border accent-[var(--pb-primary)]" />
                My reports
              </label>
            </>
          )}
        </div>
        {activeCount > 0 && (
          <button type="button" onClick={onClear} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-dash-primary hover:bg-dash-primary-soft">
            <X size={14} aria-hidden="true" /> Clear {activeCount} filter{activeCount === 1 ? '' : 's'}
          </button>
        )}
      </div>
      </div>
    </section>
  );
}
