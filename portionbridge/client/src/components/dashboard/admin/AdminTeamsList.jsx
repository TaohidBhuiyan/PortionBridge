import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Crown } from 'lucide-react';
import { EmptyState } from '../EmptyState';
import { ErrorState } from '../ErrorState';
import { SkeletonTable } from '../skeletons';
import { AdminPagination } from './AdminPagination';
import { adminApi } from '../../../services/adminApi';

const PAGE_SIZE = 15;

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/**
 * AdminTeamsList — "Team list" with leader, member count, and active/
 * completed mission counts (Phase 4). Data from GET /admin/teams
 * (admin.service.js#listTeams, new this phase) — team.model.js/
 * teamMember.model.js weren't extended, since their existing functions
 * are single-team lookups scoped to "my team", not a paginated
 * admin-wide list.
 */
export function AdminTeamsList() {
  const navigate = useNavigate();

  const [teams, setTeams] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      const result = await adminApi.listTeams({
        search: search || undefined,
        page,
        limit: PAGE_SIZE,
      });
      if (cancelled) return;
      if (result.success) {
        setTeams(result.data || []);
        setMeta(result.meta || null);
      } else {
        setError(result.error);
        setTeams([]);
      }
      setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [search, page, refreshTrigger]);

  return (
    <div className="space-y-4">
      <div className="bg-surface rounded-lg border border-border/50 p-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary w-4 h-4" aria-hidden="true" />
          <input
            type="text"
            placeholder="Search by team name..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 border border-border rounded-lg bg-page text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-dash-primary focus:border-transparent transition-all"
            aria-label="Search teams"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-surface rounded-lg border border-border/50 p-4">
          <SkeletonTable rows={6} columns={5} />
        </div>
      ) : error ? (
        <ErrorState title="Failed to load teams" message={error} onRetry={() => setRefreshTrigger((t) => t + 1)} />
      ) : teams.length === 0 ? (
        <EmptyState icon={Users} title="No teams found" description="Try a different search." showAction={false} />
      ) : (
        <>
          <div className="bg-surface rounded-lg border border-border/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary">Team</th>
                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary">Leader</th>
                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary">Members</th>
                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary">Active Missions</th>
                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {teams.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => navigate(`/admin/teams/${t.id}`)}
                      className="border-b border-border/50 last:border-0 hover:bg-surface-hover transition-colors cursor-pointer"
                    >
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-md bg-dash-primary-soft flex items-center justify-center shrink-0">
                            <Users size={14} className="text-dash-primary" />
                          </div>
                          <p className="text-xs font-medium text-text-primary truncate max-w-[180px]">{t.name}</p>
                        </div>
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                          <Crown size={12} className="text-warning shrink-0" />
                          <span className="truncate max-w-[140px]">{t.leader_name || '—'}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-xs text-text-secondary">{t.memberCount}</td>
                      <td className="py-2.5 px-4 text-xs text-text-secondary">{t.activeMissions}</td>
                      <td className="py-2.5 px-4 text-xs text-text-secondary whitespace-nowrap">{formatDate(t.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <AdminPagination page={page} totalPages={meta?.totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}
