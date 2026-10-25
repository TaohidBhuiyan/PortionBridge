import { useState } from 'react';
import toast from 'react-hot-toast';
import { Siren, Info } from 'lucide-react';
import { ErrorState } from '../ErrorState';
import { useApiResource } from '../../../hooks/useApiResource';
import alertApi from '../../../services/alertApi';
import { BD_DISTRICTS } from '../../../utils/bdDistricts';
import { DISASTER_TYPES, apiErrorMessage } from '../../../utils/relief';

const SEVERITY_FLOORS = [
  { value: 'low', label: 'All alerts (Information and above)' },
  { value: 'moderate', label: 'Warning and above' },
  { value: 'high', label: 'High priority and above' },
  { value: 'critical', label: 'Critical emergencies only' },
];

function Toggle({ id, checked, onChange, label, hint }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-start justify-between gap-4 rounded-2xl border border-border bg-surface p-4">
      <span>
        <span className="block text-sm font-semibold text-text-primary">{label}</span>
        {hint && <span className="mt-0.5 block text-xs text-text-secondary">{hint}</span>}
      </span>
      <input id={id} type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-5 w-5 shrink-0 accent-[var(--color-dash-primary,#0ea5e9)]" />
    </label>
  );
}

function Form({ initial, policy, onSaved }) {
  const [form, setForm] = useState(() => ({
    nearbyEnabled: initial.nearbyEnabled,
    nationwideEnabled: initial.nationwideEnabled,
    inAppEnabled: initial.inAppEnabled,
    minSeverity: initial.minSeverity,
    radiusKm: initial.radiusKm ?? '',
    districts: initial.districts,
    categories: initial.categories,
    centerLatitude: initial.centerLatitude ?? '',
    centerLongitude: initial.centerLongitude ?? '',
  }));
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const toggleIn = (key, value) => set({ [key]: form[key].includes(value) ? form[key].filter((v) => v !== value) : [...form[key], value] });

  // Browser location is requested ONLY when the user presses the button, and is stored rounded (~1 km).
  const useMyLocation = () => {
    if (!navigator.geolocation) { toast.error('Your browser does not support location.'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set({ centerLatitude: Math.round(pos.coords.latitude * 100) / 100, centerLongitude: Math.round(pos.coords.longitude * 100) / 100 });
        setLocating(false);
      },
      () => { toast.error('Location permission was not granted. You can still choose districts.'); setLocating(false); },
      { maximumAge: 600000, timeout: 10000 }
    );
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    const hasCenter = form.centerLatitude !== '' && form.centerLongitude !== '';
    try {
      const res = await alertApi.savePreferences({
        nearbyEnabled: form.nearbyEnabled,
        nationwideEnabled: form.nationwideEnabled,
        inAppEnabled: form.inAppEnabled,
        minSeverity: form.minSeverity,
        radiusKm: form.radiusKm === '' ? null : Number(form.radiusKm),
        districts: form.districts,
        categories: form.categories,
        centerLatitude: hasCenter ? Number(form.centerLatitude) : null,
        centerLongitude: hasCenter ? Number(form.centerLongitude) : null,
      });
      toast.success('Disaster alert preferences saved.');
      onSaved(res.data);
    } catch (err) {
      toast.error(apiErrorMessage(err, 'Could not save your alert preferences.'));
    } finally {
      setSaving(false);
    }
  };

  const hasCenter = form.centerLatitude !== '' && form.centerLongitude !== '';

  return (
    <form onSubmit={save} className="space-y-4" aria-label="Disaster alert preferences">
      <div role="note" className="flex gap-3 rounded-2xl border border-info/30 bg-info-soft p-4 text-sm text-text-primary">
        <Info size={18} className="mt-0.5 shrink-0 text-info" aria-hidden="true" />
        <div>
          <p className="font-semibold">Critical emergencies are always delivered</p>
          <p className="mt-0.5 text-xs text-text-secondary">{policy.mandatoryDescription} {policy.channelsNote}</p>
        </div>
      </div>

      <Toggle id="alert-nearby" checked={form.nearbyEnabled} onChange={(v) => set({ nearbyEnabled: v })}
        label="Nearby alerts" hint="Incidents in your preferred districts or within your chosen distance." />
      <Toggle id="alert-nationwide" checked={form.nationwideEnabled} onChange={(v) => set({ nationwideEnabled: v })}
        label="Nationwide major-emergency alerts" hint="Major disasters anywhere in Bangladesh that an administrator classifies as nationwide." />
      <Toggle id="alert-inapp" checked={form.inAppEnabled} onChange={(v) => set({ inAppEnabled: v })}
        label="In-app alert inbox" hint="Optional alerts appear in your notification inbox. Turning this off does not stop critical nationwide alerts." />

      <fieldset className="rounded-2xl border border-border bg-surface p-4">
        <legend className="px-1 text-sm font-semibold text-text-primary">Which alerts matter to you</legend>
        <label className="block text-xs font-medium text-text-secondary" htmlFor="alert-min-severity">Minimum level</label>
        <select id="alert-min-severity" value={form.minSeverity} onChange={(e) => set({ minSeverity: e.target.value })}
          className="mt-1 w-full rounded-xl border border-border bg-page px-3 py-2 text-sm text-text-primary">
          {SEVERITY_FLOORS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <p className="mt-3 text-xs font-medium text-text-secondary">Disaster types <span className="font-normal">(none selected = all types)</span></p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {DISASTER_TYPES.map((t) => {
            const on = form.categories.includes(t.value);
            return (
              <button key={t.value} type="button" aria-pressed={on} onClick={() => toggleIn('categories', t.value)}
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${on ? 'border-dash-primary bg-dash-primary-soft text-dash-primary' : 'border-border bg-page text-text-secondary hover:bg-surface-hover'}`}>
                {t.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="rounded-2xl border border-border bg-surface p-4">
        <legend className="px-1 text-sm font-semibold text-text-primary">Where</legend>
        <label className="block text-xs font-medium text-text-secondary" htmlFor="alert-districts">Preferred districts</label>
        <div id="alert-districts" className="mt-1.5 flex max-h-40 flex-wrap gap-1.5 overflow-y-auto rounded-xl border border-border bg-page p-2">
          {BD_DISTRICTS.map((d) => {
            const on = form.districts.includes(d);
            return (
              <button key={d} type="button" aria-pressed={on} onClick={() => toggleIn('districts', d)}
                className={`rounded-full border px-2.5 py-0.5 text-xs ${on ? 'border-dash-primary bg-dash-primary-soft font-semibold text-dash-primary' : 'border-border text-text-secondary hover:bg-surface-hover'}`}>
                {d}
              </button>
            );
          })}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-text-secondary" htmlFor="alert-radius">Distance for nearby alerts (km, optional)</label>
            <input id="alert-radius" type="number" min="1" max="500" value={form.radiusKm}
              onChange={(e) => set({ radiusKm: e.target.value })} placeholder="25"
              className="mt-1 w-full rounded-xl border border-border bg-page px-3 py-2 text-sm text-text-primary" />
          </div>
          <div>
            <span className="block text-xs font-medium text-text-secondary">Approximate area (optional)</span>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <button type="button" onClick={useMyLocation} disabled={locating}
                className="rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-text-primary hover:bg-surface-hover disabled:opacity-60">
                {locating ? 'Locating…' : 'Use my approximate location'}
              </button>
              {hasCenter && (
                <button type="button" onClick={() => set({ centerLatitude: '', centerLongitude: '' })} className="text-xs font-semibold text-danger">Clear</button>
              )}
            </div>
            <p className="mt-1 text-xs text-text-muted">
              {hasCenter ? 'Saved as a rounded point (about 1 km), never an exact address.' : 'Not set. Only requested when you press the button; districts work without it.'}
            </p>
          </div>
        </div>
      </fieldset>

      <div className="flex justify-end">
        <button type="submit" disabled={saving}
          className="rounded-xl bg-dash-primary px-5 py-2 text-sm font-semibold text-white hover:bg-dash-primary-hover disabled:opacity-60">
          {saving ? 'Saving…' : 'Save alert preferences'}
        </button>
      </div>
    </form>
  );
}

/** Optional personalisation of disaster alerts. Defaults (no saved row) keep everything on. */
export function DisasterAlertSettings() {
  const state = useApiResource(alertApi.getPreferences);
  const [saved, setSaved] = useState(null);
  const data = saved || state.data?.data;

  return (
    <section aria-labelledby="disaster-alert-settings-title" className="mt-8">
      <div className="mb-4 flex items-center gap-2">
        <Siren size={18} className="text-dash-primary" aria-hidden="true" />
        <h3 id="disaster-alert-settings-title" className="text-lg font-bold text-text-primary">Disaster alerts</h3>
      </div>
      {state.loading && !data ? (
        <div role="status" aria-label="Loading alert preferences" className="h-40 animate-pulse rounded-2xl bg-surface-hover" />
      ) : state.error && !data ? (
        <ErrorState title="Could not load alert preferences" message={apiErrorMessage(state.error)} onRetry={state.reload} size="small" />
      ) : (
        <Form key={data.preferences.updatedAt || 'default'} initial={data.preferences} policy={data.policy} onSaved={setSaved} />
      )}
    </section>
  );
}

export default DisasterAlertSettings;
