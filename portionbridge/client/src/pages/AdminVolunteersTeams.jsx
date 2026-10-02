import { useState } from 'react';
import { UserCheck, Users } from 'lucide-react';
import { DashboardLayout } from '../components/dashboard';
import { AdminVolunteersList, AdminTeamsList } from '../components/dashboard/admin';

const TABS = [
  {
    key: 'volunteers',
    label: 'Volunteers',
    icon: UserCheck,
    description: 'Monitor volunteer performance, activity, and assignment history.',
  },
  {
    key: 'teams',
    label: 'Teams',
    icon: Users,
    description: 'Manage teams, view team composition, and track coordination.',
  },
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

  const activeTabData = TABS.find((t) => t.key === activeTab);

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ── Gradient Hero Header ── */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-700 dark:from-purple-900 dark:via-violet-950 dark:to-indigo-950 p-6 md:p-8 shadow-pb-elevated text-white">
          {/* Decorative blur circles */}
          <div className="pointer-events-none absolute -top-16 -right-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-12 -left-12 h-48 w-48 rounded-full bg-indigo-400/20 blur-3xl" />
          <div className="pointer-events-none absolute top-1/2 right-1/3 h-32 w-32 -translate-y-1/2 rounded-full bg-violet-300/10 blur-2xl" />

          <div className="relative flex items-center gap-4">
            {/* Icon badge */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 border border-white/25 shadow-inner backdrop-blur-md">
              <UserCheck className="h-7 w-7 text-white drop-shadow" strokeWidth={2} />
            </div>

            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                Volunteers &amp; Teams
              </h1>
              <p className="mt-1 text-sm text-purple-100/80">
                Monitor volunteer performance, teams, and assignment activity across operations.
              </p>
            </div>
          </div>
        </div>

        {/* ── Animated Pill Tab Switcher ── */}
        <div className="flex flex-col gap-4">
          <div
            role="tablist"
            aria-label="Switch between volunteers and teams"
            className="inline-flex self-start rounded-xl border border-border/60 bg-surface p-1 shadow-sm"
          >
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveTab(tab.key)}
                  className={`relative flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 ${
                    isActive
                      ? 'bg-gradient-to-br from-purple-600 via-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/30'
                      : 'text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}
                    strokeWidth={isActive ? 2.2 : 1.8}
                  />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Per-tab description */}
          {activeTabData && (
            <p className="text-sm text-text-secondary pl-1">
              {activeTabData.description}
            </p>
          )}
        </div>

        {/* ── Child Components (logic unchanged) ── */}
        {activeTab === 'volunteers' ? <AdminVolunteersList /> : <AdminTeamsList />}
      </div>
    </DashboardLayout>
  );
}
