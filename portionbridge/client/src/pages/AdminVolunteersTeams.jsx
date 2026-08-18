import { useState } from 'react';
import { DashboardLayout } from '../components/dashboard';
import { AdminVolunteersList, AdminTeamsList } from '../components/dashboard/admin';

const TABS = [
  { key: 'volunteers', label: 'Volunteers' },
  { key: 'teams', label: 'Teams' },
];

/**
 * AdminVolunteersTeams — "Volunteers & Teams" (Phase 4), the single
 * sidebar destination covering both Volunteer Management and Team
 * Management. Tabs switch between the two independent list widgets
 * (AdminVolunteersList / AdminTeamsList); each manages its own
 * search/pagination state so switching tabs doesn't lose the other's.
 */
export function AdminVolunteersTeams() {
  const [activeTab, setActiveTab] = useState('volunteers');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">Volunteers & Teams</h1>
          <p className="text-text-secondary text-sm">
            Monitor volunteer performance, teams, and assignment activity.
          </p>
        </div>

        <div className="flex gap-1.5">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-dash-primary text-white'
                  : 'bg-surface border border-border/50 text-text-secondary hover:bg-surface-hover'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'volunteers' ? <AdminVolunteersList /> : <AdminTeamsList />}
      </div>
    </DashboardLayout>
  );
}
