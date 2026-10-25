import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Siren } from 'lucide-react';
import { DashboardLayout } from '../components/dashboard';
import { OpsFilters } from '../components/admin/ops/OpsFilters';
import { EMPTY_FILTERS } from '../components/admin/ops/opsConstants';
import { OverviewTab } from '../components/admin/ops/OverviewTab';
import { IncidentsTab } from '../components/admin/ops/IncidentsTab';
import { RequestsTab } from '../components/admin/ops/RequestsTab';
import { TasksTab } from '../components/admin/ops/TasksTab';
import { ExceptionsTab } from '../components/admin/ops/ExceptionsTab';
import { ReportsTab } from '../components/admin/ops/ReportsTab';

const TABS = [
  ['overview', 'Overview'], ['incidents', 'Incidents'], ['requests', 'Relief requests'],
  ['tasks', 'Tasks & volunteers'], ['exceptions', 'Delivery issues'], ['reports', 'Reports'],
];

/**
 * Admin disaster-operations dashboard. One page, six sections (tabs) so no single screen is overcrowded.
 * Filters are shared by every tab; clicking a summary card opens the matching list with the right preset.
 */
export function AdminOperationsPage() {
  const [tab, setTab] = useState('overview');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [preset, setPreset] = useState({});
  const navigate = (next, patch = {}) => { setPreset(patch); setTab(next); };
  const changePreset = (patch) => setPreset((p) => ({ ...p, ...patch }));
  const props = { filters, preset, onPreset: changePreset };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-4 pb-12">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-bold text-text-primary"><Activity size={22} className="text-dash-primary" aria-hidden="true" />Disaster Operations</h1>
            <p className="text-sm text-text-secondary">Monitor incidents, relief requests, volunteer tasks and deliveries across Bangladesh. All figures are read live from the database.</p>
          </div>
          <Link to="/admin/alerts" className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-2 text-sm font-semibold text-text-primary hover:bg-surface-hover"><Siren size={16} aria-hidden="true" />Disaster alerts</Link>
        </header>

        <OpsFilters filters={filters} onChange={setFilters} />

        <div role="tablist" aria-label="Operations sections" className="flex flex-wrap gap-1 border-b border-border">
          {TABS.map(([id, label]) => (
            <button key={id} id={`ops-tab-${id}`} role="tab" type="button" aria-selected={tab === id} aria-controls="ops-panel"
              onClick={() => navigate(id, {})}
              className={`-mb-px rounded-t-xl border border-transparent px-3 py-2 text-sm font-semibold ${tab === id ? 'border-border border-b-surface bg-surface text-dash-primary' : 'text-text-secondary hover:text-text-primary'}`}>{label}</button>
          ))}
        </div>
        <div id="ops-panel" role="tabpanel" aria-labelledby={`ops-tab-${tab}`}>
          {tab === 'overview' && <OverviewTab filters={filters} onNavigate={navigate} />}
          {tab === 'incidents' && <IncidentsTab {...props} />}
          {tab === 'requests' && <RequestsTab {...props} />}
          {tab === 'tasks' && <TasksTab {...props} />}
          {tab === 'exceptions' && <ExceptionsTab {...props} />}
          {tab === 'reports' && <ReportsTab filters={filters} />}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default AdminOperationsPage;
