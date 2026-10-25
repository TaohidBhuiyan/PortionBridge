import { DISASTER_TYPES, SEVERITIES, INCIDENT_STATUS_LABELS, REQUEST_STATUS_LABELS } from '../../../utils/relief';
import { BD_DISTRICTS } from '../../../utils/bdDistricts';
import { btn, field } from './opsConstants';
import { DIVISION_NAMES, EMPTY_FILTERS } from './opsConstants';


const Select = ({ id, label, value, onChange, options }) => (
  <label htmlFor={id} className="block text-[11px] font-medium text-text-secondary">{label}
    <select id={id} className={field} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">All</option>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  </label>
);

/** Filters shared by every operations tab. Upazila is not offered: it is not stored anywhere. */
export function OpsFilters({ filters, onChange }) {
  const set = (patch) => onChange({ ...filters, ...patch });
  const invalidRange = filters.from && filters.to && filters.to < filters.from;
  return (
    <form aria-label="Operations filters" onSubmit={(e) => e.preventDefault()} className="rounded-2xl border border-border bg-surface p-3">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-5">
        <Select id="f-type" label="Disaster type" value={filters.disasterType} onChange={(v) => set({ disasterType: v })} options={DISASTER_TYPES.map((t) => [t.value, t.label])} />
        <Select id="f-status" label="Incident status" value={filters.status} onChange={(v) => set({ status: v })} options={Object.entries(INCIDENT_STATUS_LABELS)} />
        <Select id="f-severity" label="Severity" value={filters.severity} onChange={(v) => set({ severity: v })} options={SEVERITIES.map((s) => [s.value, s.label])} />
        <Select id="f-verif" label="Verification" value={filters.verificationStatus} onChange={(v) => set({ verificationStatus: v })} options={[['unverified', 'Unverified'], ['verified', 'Verified'], ['rejected', 'Rejected']]} />
        <Select id="f-rstatus" label="Relief request status" value={filters.requestStatus} onChange={(v) => set({ requestStatus: v })} options={Object.entries(REQUEST_STATUS_LABELS)} />
        <Select id="f-division" label="Division" value={filters.division} onChange={(v) => set({ division: v })} options={DIVISION_NAMES.map((d) => [d, d])} />
        <Select id="f-district" label="District" value={filters.district} onChange={(v) => set({ district: v })} options={BD_DISTRICTS.map((d) => [d, d])} />
        <label htmlFor="f-from" className="block text-[11px] font-medium text-text-secondary">Reported from
          <input id="f-from" type="date" className={field} value={filters.from} onChange={(e) => set({ from: e.target.value })} />
        </label>
        <label htmlFor="f-to" className="block text-[11px] font-medium text-text-secondary">Reported to
          <input id="f-to" type="date" className={field} value={filters.to} onChange={(e) => set({ to: e.target.value })} />
        </label>
        <div className="flex items-end"><button type="button" className={btn} onClick={() => onChange(EMPTY_FILTERS)}>Reset filters</button></div>
      </div>
      {invalidRange && <p role="alert" className="mt-2 text-xs font-semibold text-danger">&quot;To&quot; must not be before &quot;From&quot;.</p>}
      <p className="mt-2 text-[11px] text-text-muted">Upazila is not recorded in the incident data, so filtering is by division and district (division is derived from the district).</p>
    </form>
  );
}
