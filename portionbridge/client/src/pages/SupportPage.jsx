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
  open: { label: 'Open', className: 'bg-success-soft text-success border-success/20' },
  in_progress: { label: 'In Progress', className: 'bg-info-soft text-info border-info/20' },
  awaiting_user: { label: 'Awaiting Your Response', className: 'bg-warning-soft text-warning border-warning/20' },
  resolved: { label: 'Resolved', className: 'bg-surface-hover text-text-secondary border-border' },
  closed: { label: 'Closed', className: 'bg-surface-hover text-text-muted border-border' },
};

const PRIORITY_BADGES = {
  low: { label: 'Low', className: 'text-text-muted' },
  normal: { label: 'Normal', className: 'text-info font-medium' },
  high: { label: 'High', className: 'text-warning font-semibold' },
  urgent: { label: 'Urgent', className: 'text-danger font-bold' },
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
    <DashboardLayout title="Help & Support Desk">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-surface border border-border shadow-pb-card relative overflow-hidden">
          <div className="space-y-1 relative z-10">
            <div className="flex items-center gap-2 text-dash-primary text-xs font-bold tracking-wider uppercase">
              <LifeBuoy className="w-4 h-4" />
              <span>Support Desk</span>
            </div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Need assistance? We're here to help.</h1>
            <p className="text-text-secondary text-xs max-w-xl">
              Submit a support ticket to chat directly with our administration team regarding account issues, donations, pickups, or safety concerns.
            </p>
          </div>
          <button
            onClick={() => navigate('/support/new')}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-dash-primary hover:bg-dash-primary-hover text-white font-bold transition shadow-pb-card hover:scale-[1.01] active:scale-[0.99] shrink-0 z-10"
          >
            <Plus className="w-5 h-5" />
            <span>Open New Ticket</span>
          </button>
        </div>

        {/* Controls: Tabs & Search */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface p-3 rounded-2xl border border-border shadow-pb-card">
          <div className="flex items-center gap-1 bg-page p-1 rounded-xl border border-border">
            <button
              onClick={() => { setGroup('active'); setPagination((p) => ({ ...p, page: 1 })); }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                group === 'active' ? 'bg-dash-primary text-white shadow-xs' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Active Tickets
            </button>
            <button
              onClick={() => { setGroup('all'); setPagination((p) => ({ ...p, page: 1 })); }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                group === 'all' ? 'bg-dash-primary text-white shadow-xs' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              All Tickets
            </button>
            <button
              onClick={() => { setGroup('resolved'); setPagination((p) => ({ ...p, page: 1 })); }}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition ${
                group === 'resolved' ? 'bg-dash-primary text-white shadow-xs' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Resolved & Closed
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search tickets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-page text-text-primary text-xs pl-9 pr-3 py-2.5 rounded-xl border border-border focus:border-dash-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Tickets List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-surface rounded-2xl border border-border animate-pulse" />
            ))}
          </div>
        ) : tickets.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-surface border border-border shadow-pb-card space-y-4">
            <div className="w-12 h-12 rounded-full bg-dash-primary-soft text-dash-primary flex items-center justify-center mx-auto">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-text-primary">No support tickets found</h3>
              <p className="text-text-muted text-xs max-w-sm mx-auto">
                {search ? 'Try adjusting your search criteria.' : 'If you need assistance, open a ticket and our admins will reply promptly.'}
              </p>
            </div>
            <button
              onClick={() => navigate('/support/new')}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-dash-primary text-white hover:bg-dash-primary-hover transition shadow-xs"
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
                  className="group relative p-5 rounded-2xl bg-surface border border-border hover:border-dash-primary/40 transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-pb-card hover:shadow-pb-elevated"
                >
                  {ticket.user_unread === 1 && (
                    <span className="absolute -top-1 -left-1 w-3.5 h-3.5 rounded-full bg-dash-primary ring-4 ring-surface animate-pulse" />
                  )}

                  <div className="space-y-2 max-w-2xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-text-muted">#{ticket.id}</span>
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-semibold ${statusBadge.className}`}>
                        {statusBadge.label}
                      </span>
                      <span className="text-[11px] px-2.5 py-0.5 rounded-md bg-page border border-border text-text-secondary font-medium capitalize">
                        {ticket.category}
                      </span>
                      {ticket.priority !== 'normal' && (
                        <span className={`text-[11px] ${priorityBadge.className}`}>
                          {priorityBadge.label} Priority
                        </span>
                      )}
                    </div>

                    <h2 className="text-base font-bold text-text-primary group-hover:text-dash-primary transition-colors">
                      {ticket.subject}
                    </h2>

                    {ticket.last_message && (
                      <p className="text-xs text-text-secondary line-clamp-1 italic">
                        "{ticket.last_message}"
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between md:flex-col md:items-end gap-2 text-xs text-text-muted shrink-0">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{formatDate(ticket.last_message_at || ticket.created_at)}</span>
                    </div>
                    <span className="text-dash-primary font-bold flex items-center gap-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
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
