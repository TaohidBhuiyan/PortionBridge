import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LifeBuoy,
  Plus,
  Search,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
  ArrowRight,
  Filter,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DashboardLayout } from '../components/dashboard';
import { supportApi } from '../services/supportApi';

const STATUS_BADGES = {
  open: { label: 'Open', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  in_progress: { label: 'In Progress', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  awaiting_user: { label: 'Awaiting Your Response', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  resolved: { label: 'Resolved', bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  closed: { label: 'Closed', bg: 'bg-slate-800 text-slate-500 border-slate-700' },
};

const PRIORITY_BADGES = {
  low: { label: 'Low', bg: 'text-slate-400' },
  normal: { label: 'Normal', bg: 'text-blue-400' },
  high: { label: 'High', bg: 'text-amber-400' },
  urgent: { label: 'Urgent', bg: 'text-rose-400 font-semibold' },
};

export function SupportPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState('active');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1 });

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      const res = await supportApi.getMyTickets({ group, search, page: pagination.page, limit: 10 });
      setTickets(res.data.tickets || []);
      setPagination(res.meta?.pagination || { page: 1, totalPages: 1 });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  }, [group, search, pagination.page]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <DashboardLayout title="Help & Support">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/20 shadow-xl relative overflow-hidden">
          <div className="space-y-1 relative z-10">
            <div className="flex items-center gap-2 text-emerald-400 text-sm font-semibold tracking-wide uppercase">
              <LifeBuoy className="w-4 h-4" />
              <span>Support Desk</span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Need assistance? We're here to help.</h1>
            <p className="text-slate-400 text-sm max-w-xl">
              Submit a support ticket to chat directly with our administration team regarding account issues, donations, pickups, or safety concerns.
            </p>
          </div>
          <button
            onClick={() => navigate('/support/new')}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold transition shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] shrink-0 z-10"
          >
            <Plus className="w-5 h-5" />
            <span>Open New Ticket</span>
          </button>
        </div>

        {/* Controls: Tabs & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800/80">
            <button
              onClick={() => { setGroup('active'); setPagination((p) => ({ ...p, page: 1 })); }}
              className={`px-4 py-2 rounded-md text-xs font-semibold transition ${
                group === 'active' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Active Tickets
            </button>
            <button
              onClick={() => { setGroup('all'); setPagination((p) => ({ ...p, page: 1 })); }}
              className={`px-4 py-2 rounded-md text-xs font-semibold transition ${
                group === 'all' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Tickets
            </button>
            <button
              onClick={() => { setGroup('resolved'); setPagination((p) => ({ ...p, page: 1 })); }}
              className={`px-4 py-2 rounded-md text-xs font-semibold transition ${
                group === 'resolved' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Resolved & Closed
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 text-slate-200 text-xs pl-9 pr-3 py-2.5 rounded-lg border border-slate-800 focus:outline-none focus:border-emerald-500/50"
            />
          </div>
        </div>

        {/* Tickets List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-slate-900/40 rounded-xl border border-slate-800 animate-pulse" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-slate-200">No support tickets found</h3>
              <p className="text-slate-400 text-xs max-w-sm mx-auto">
                {search ? 'Try adjusting your search criteria.' : 'If you need assistance, open a ticket and our admins will reply promptly.'}
              </p>
            </div>
            <button
              onClick={() => navigate('/support/new')}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Ticket</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((ticket) => {
              const statusBadge = STATUS_BADGES[ticket.status] || STATUS_BADGES.open;
              const priorityBadge = PRIORITY_BADGES[ticket.priority] || PRIORITY_BADGES.normal;

              return (
                <div
                  key={ticket.id}
                  onClick={() => navigate(`/support/${ticket.id}`)}
                  className="group relative p-5 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-emerald-500/40 hover:bg-slate-900 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm"
                >
                  {ticket.user_unread === 1 && (
                    <span className="absolute -top-1 -left-1 w-3 h-3 rounded-full bg-emerald-500 ring-4 ring-slate-950 animate-pulse" />
                  )}

                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-medium text-slate-500">#{ticket.id}</span>
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-medium ${statusBadge.bg}`}>
                        {statusBadge.label}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-medium capitalize">
                        {ticket.category}
                      </span>
                      {ticket.priority !== 'normal' && (
                        <span className={`text-[11px] ${priorityBadge.bg}`}>
                          {priorityBadge.label} Priority
                        </span>
                      )}
                    </div>

                    <h2 className="text-base font-semibold text-slate-100 group-hover:text-emerald-400 transition-colors">
                      {ticket.subject}
                    </h2>

                    {ticket.last_message && (
                      <p className="text-xs text-slate-400 line-clamp-1 italic">
                        "{ticket.last_message}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between md:flex-col md:items-end gap-2 text-xs text-slate-500 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDate(ticket.last_message_at || ticket.created_at)}</span>
                    </div>
                    <span className="text-emerald-400 font-medium flex items-center gap-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                      View Thread <ArrowRight className="w-3.5 h-3.5" />
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
export default SupportPage;
