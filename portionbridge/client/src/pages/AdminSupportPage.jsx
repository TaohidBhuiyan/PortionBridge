import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Inbox,
  Clock,
  UserCheck,
  AlertTriangle,
  Search,
  Filter,
  ArrowRight,
  Shield,
  LifeBuoy,
  RefreshCw,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DashboardLayout } from '../components/dashboard';
import { supportApi } from '../services/supportApi';

const STATUS_BADGES = {
  open: { label: 'Open', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  in_progress: { label: 'In Progress', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  awaiting_user: { label: 'Awaiting User', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  resolved: { label: 'Resolved', bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  closed: { label: 'Closed', bg: 'bg-slate-800 text-slate-500 border-slate-700' },
};

const PRIORITY_BADGES = {
  low: { label: 'Low', bg: 'bg-slate-800 text-slate-400 border-slate-700' },
  normal: { label: 'Normal', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  high: { label: 'High', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  urgent: { label: 'Urgent', bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20 font-semibold' },
};

export function AdminSupportPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ open: 0, unassigned: 0, mine: 0, highPriority: 0 });
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('');
  const [assigned, setAssigned] = useState('all');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, ticketsRes] = await Promise.all([
        supportApi.getAdminStats(),
        supportApi.getAdminTickets({ status, category, priority, assigned, search, page: pagination.page, limit: 15 }),
      ]);
      setStats(statsRes.data.stats || { open: 0, unassigned: 0, mine: 0, highPriority: 0 });
      setTickets(ticketsRes.data.tickets || []);
      setPagination(ticketsRes.meta?.pagination || { page: 1, totalPages: 1 });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load support data');
    } finally {
      setLoading(false);
    }
  }, [status, category, priority, assigned, search, pagination.page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <DashboardLayout title="Admin Support Inbox">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <LifeBuoy className="w-6 h-6 text-emerald-400" />
              <span>Support Ticket Desk</span>
            </h1>
            <p className="text-slate-400 text-xs mt-1">Manage and resolve support tickets submitted by donors and volunteers.</p>
          </div>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Open Tickets</span>
              <Inbox className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold text-white">{stats.open}</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Unassigned</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-white">{stats.unassigned}</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Assigned to Me</span>
              <UserCheck className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white">{stats.mine}</div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>High Priority</span>
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            </div>
            <div className="text-2xl font-bold text-white">{stats.highPriority}</div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search ticket #, subject, or user..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950 text-slate-200 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500/50"
              />
            </div>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-slate-950 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-800"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="awaiting_user">Awaiting User</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="bg-slate-950 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-800"
            >
              <option value="">All Categories</option>
              <option value="account">Account</option>
              <option value="donation">Donation</option>
              <option value="pickup">Pickup</option>
              <option value="technical">Technical</option>
              <option value="safety">Safety</option>
              <option value="feedback">Feedback</option>
              <option value="other">Other</option>
            </select>

            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="bg-slate-950 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-800"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>

            <select
              value={assigned}
              onChange={(e) => setAssigned(e.target.value)}
              className="bg-slate-950 text-slate-200 text-xs px-3 py-2 rounded-xl border border-slate-800"
            >
              <option value="all">All Assignments</option>
              <option value="me">Assigned to Me</option>
              <option value="unassigned">Unassigned</option>
            </select>
          </div>
        </div>

        {/* Ticket List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-slate-900/40 rounded-xl border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-2">
            <h3 className="text-base font-semibold text-slate-200">No support tickets match your filters</h3>
            <p className="text-slate-400 text-xs">Try clearing filters or search query.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => {
              const statusBadge = STATUS_BADGES[t.status] || STATUS_BADGES.open;
              const priorityBadge = PRIORITY_BADGES[t.priority] || PRIORITY_BADGES.normal;

              return (
                <div
                  key={t.id}
                  onClick={() => navigate(`/admin/support/${t.id}`)}
                  className="group relative p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  {t.admin_unread === 1 && (
                    <span className="absolute -top-1 -left-1 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-slate-950 animate-pulse" />
                  )}

                  <div className="space-y-1.5 max-w-3xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-medium text-slate-500">#{t.id}</span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full border ${statusBadge.bg}`}>
                        {statusBadge.label}
                      </span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full border ${priorityBadge.bg}`}>
                        {priorityBadge.label}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 capitalize">
                        {t.category}
                      </span>
                    </div>

                    <h2 className="text-sm font-semibold text-slate-100 group-hover:text-emerald-400 transition-colors">
                      {t.subject}
                    </h2>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="font-medium text-slate-300">{t.user_name}</span>
                      <span className="text-slate-600">({t.user_role})</span>
                      {t.assigned_admin_name && (
                        <>
                          <span>•</span>
                          <span className="text-emerald-400/80">Assigned: {t.assigned_admin_name}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:flex-col md:items-end gap-1.5 text-xs text-slate-500 shrink-0">
                    <span>{formatDate(t.last_message_at)}</span>
                    <span className="text-emerald-400 font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      Open Detail <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
export default AdminSupportPage;
