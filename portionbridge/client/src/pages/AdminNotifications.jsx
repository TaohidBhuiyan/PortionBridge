import { useState, useEffect } from 'react';
import { Megaphone, Users, HeartHandshake, UserCheck, Send, CheckCircle2 } from 'lucide-react';
import { DashboardLayout, EmptyState, ErrorState } from '../components/dashboard';
import { SkeletonCard } from '../components/dashboard/skeletons';
import { adminApi } from '../services/adminApi';

const AUDIENCES = [
  { value: 'all', label: 'Everyone', icon: Megaphone, description: 'All donors and volunteers platform-wide' },
  { value: 'donors', label: 'Donors', icon: HeartHandshake, description: 'All donor accounts' },
  { value: 'volunteers', label: 'Volunteers', icon: UserCheck, description: 'All volunteer accounts' },
  { value: 'team', label: 'A Team', icon: Users, description: "One team's members (reuses the team announcement feature)" },
];

function formatDateTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

/**
 * AdminNotifications — "Notifications" (Phase 8: admin announcement
 * sending + history).
 *
 * Everyone/Donors/Volunteers go through the new
 * notificationService.sendAdminAnnouncement (admin.service.js#sendAnnouncement);
 * "A Team" goes straight to the EXISTING notificationService.sendTeamAnnouncement
 * — the same mechanism a team leader already uses, not a reimplementation.
 * History only covers the first three (see admin.model.js#findSentAnnouncements
 * for why team announcements aren't attributable there).
 */
export function AdminNotifications() {
  const [audience, setAudience] = useState('all');
  const [teams, setTeams] = useState([]);
  const [teamId, setTeamId] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(null);
  const [sendResult, setSendResult] = useState(null);

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    let cancelled = false;
    adminApi.listTeams({ limit: 100 }).then((result) => {
      if (!cancelled && result.success) setTeams(result.data || []);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setHistoryLoading(true);
      setHistoryError(null);
      const result = await adminApi.getAnnouncementHistory();
      if (cancelled) return;
      if (result.success) {
        setHistory(result.data || []);
      } else {
        setHistoryError(result.error);
      }
      setHistoryLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [refreshTrigger]);

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);
    setSendError(null);
    setSendResult(null);

    const result = await adminApi.sendAnnouncement({
      audience,
      teamId: audience === 'team' ? Number(teamId) : undefined,
      title: audience !== 'team' ? title : undefined,
      message,
    });

    setSending(false);
    if (result.success) {
      setSendResult(result.data);
      setTitle('');
      setMessage('');
      setTeamId('');
      setRefreshTrigger((t) => t + 1);
    } else {
      setSendError(result.error);
    }
  };

  const canSubmit = message.trim() && (audience !== 'team' ? title.trim() : teamId);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary mb-1">Notifications</h1>
          <p className="text-text-secondary text-sm">Send announcements and review what's already gone out.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Send form */}
          <form onSubmit={handleSend} className="bg-surface rounded-lg border border-border/50 p-5 space-y-4">
            <h2 className="text-sm font-semibold text-text-primary">Send Announcement</h2>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-2">Audience</label>
              <div className="grid grid-cols-2 gap-2">
                {AUDIENCES.map((a) => {
                  const Icon = a.icon;
                  return (
                    <button
                      key={a.value}
                      type="button"
                      onClick={() => setAudience(a.value)}
                      className={`text-left p-3 rounded-lg border transition-colors ${
                        audience === a.value
                          ? 'border-dash-primary bg-dash-primary-soft'
                          : 'border-border/50 hover:bg-surface-hover'
                      }`}
                    >
                      <Icon size={14} className={audience === a.value ? 'text-dash-primary' : 'text-text-secondary'} />
                      <p className="text-xs font-medium text-text-primary mt-1">{a.label}</p>
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-text-secondary mt-1.5">
                {AUDIENCES.find((a) => a.value === audience)?.description}
              </p>
            </div>

            {audience === 'team' && (
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5" htmlFor="team-select">Team</label>
                <select
                  id="team-select"
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-page text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-dash-primary focus:border-transparent transition-all"
                >
                  <option value="">Select a team...</option>
                  {teams.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            )}

            {audience !== 'team' && (
              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5" htmlFor="announcement-title">Title</label>
                <input
                  id="announcement-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={150}
                  placeholder="e.g. Scheduled maintenance tonight"
                  className="w-full px-3 py-2 border border-border rounded-lg bg-page text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-dash-primary focus:border-transparent transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1.5" htmlFor="announcement-message">Message</label>
              <textarea
                id="announcement-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={4}
                maxLength={500}
                placeholder="Write your announcement..."
                className="w-full px-3 py-2 border border-border rounded-lg bg-page text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-dash-primary focus:border-transparent transition-all"
              />
            </div>

            {sendError && <p className="text-xs text-danger">{sendError}</p>}
            {sendResult && (
              <p className="text-xs text-success flex items-center gap-1.5">
                <CheckCircle2 size={13} /> Sent to {sendResult.recipientCount} recipient{sendResult.recipientCount !== 1 ? 's' : ''}.
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit || sending}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg bg-dash-primary text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={14} /> {sending ? 'Sending...' : 'Send Announcement'}
            </button>
          </form>

          {/* History */}
          <div className="bg-surface rounded-lg border border-border/50 p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-3">Announcement History</h2>
            {historyLoading ? (
              <SkeletonCard count={4} />
            ) : historyError ? (
              <ErrorState title="Failed to load history" message={historyError} onRetry={() => setRefreshTrigger((t) => t + 1)} size="small" />
            ) : history.length === 0 ? (
              <EmptyState icon={Megaphone} title="No announcements sent yet" showAction={false} size="small" />
            ) : (
              <ul className="divide-y divide-border/50 max-h-[420px] overflow-y-auto">
                {history.map((a) => (
                  <li key={a.id} className="py-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-xs font-medium text-text-primary truncate">{a.title}</p>
                      <span className="text-[11px] text-text-secondary whitespace-nowrap">{formatDateTime(a.created_at)}</span>
                    </div>
                    <p className="text-xs text-text-secondary mb-1.5 line-clamp-2">{a.message}</p>
                    <p className="text-[11px] text-text-secondary">
                      Sent to {a.recipientCount} · Read by {a.readCount}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
