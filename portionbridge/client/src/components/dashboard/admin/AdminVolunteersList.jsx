import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UserCheck } from 'lucide-react';
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
 * AdminVolunteersList — "All volunteers" with derived active/available
 * status and completion/cancellation rate (Phase 4). Data from GET
 * /admin/volunteers (admin.service.js#listVolunteers), which now returns
 * isActive/currentStatus/completionRate/cancellationRate alongside the
 * existing activeAssignments/completedPickups fields.
 */
export function AdminVolunteersList() {
  const navigate = useNavigate();

  const [volunteers, setVolunteers] = useState([]);
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
      const result = await adminApi.listVolunteers({
        search: search || undefined,
        page,
        limit: PAGE_SIZE,
      });
      if (cancelled) return;
      if (result.success) {
        setVolunteers(result.data || []);
        setMeta(result.meta || null);
      } else {
        setError(result.error);
        setVolunteers([]);
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
            placeholder="Search by name, email, or volunteer ID..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2.5 border border-border rounded-lg bg-page text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-dash-primary focus:border-transparent transition-all"
            aria-label="Search volunteers by name, email, or ID"
          />
        </div>
      </div>

      {loading ? (
        <div className="bg-surface rounded-lg border border-border/50 p-4">
          <SkeletonTable rows={8} columns={6} />
        </div>
      ) : error ? (
        <ErrorState title="Failed to load volunteers" message={error} onRetry={() => setRefreshTrigger((t) => t + 1)} />
      ) : volunteers.length === 0 ? (
        <EmptyState icon={UserCheck} title="No volunteers found" description="Try a different search." showAction={false} />
      ) : (
        <>
          <div className="bg-surface rounded-lg border border-border/50 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary">Volunteer</th>
                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary">ID</th>
                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary">Status</th>
                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary">Completed</th>
                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary">Completion Rate</th>
                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary">Cancellation Rate</th>
                    <th className="text-left py-2.5 px-4 text-xs font-semibold text-text-secondary">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {volunteers.map((v) => (
                    <tr
                      key={v.id}
                      onClick={() => navigate(`/admin/volunteers/${v.id}`)}
                      className="border-b border-border/50 last:border-0 hover:bg-surface-hover transition-colors cursor-pointer"
                    >
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-dash-primary-soft flex items-center justify-center shrink-0">
                            <UserCheck size={14} className="text-dash-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium text-text-primary truncate max-w-[180px]">{v.name}</p>
                            <p className="text-[11px] text-text-secondary truncate max-w-[180px]">{v.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-xs font-mono text-text-secondary">#{v.id}</td>
                      <td className="py-2.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                          v.isActive ? 'bg-warning-soft text-warning' : 'bg-success-soft text-success'
                        }`}>
                          {v.currentStatus}
                        </span>
                        {!!v.is_banned && (
                          <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-danger-soft text-danger">
                            Banned
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-xs text-text-secondary">{v.completedPickups}</td>
                      <td className="py-2.5 px-4 text-xs text-text-secondary">{v.completionRate}%</td>
                      <td className="py-2.5 px-4 text-xs text-text-secondary">{v.cancellationRate}%</td>
                      <td className="py-2.5 px-4 text-xs text-text-secondary whitespace-nowrap">{formatDate(v.created_at)}</td>
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
