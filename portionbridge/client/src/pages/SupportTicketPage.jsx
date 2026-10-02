import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Clock,
  CheckCircle2,
  Lock,
  RotateCcw,
  User,
  Shield,
  LifeBuoy,
  FileText,
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

export function SupportTicketPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchTicket = useCallback(async () => {
    try {
      setLoading(true);
      const res = await supportApi.getTicket(id);
      setTicket(res.data.ticket);
      setMessages(res.data.messages || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load support ticket');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendReply = async (e) => {
    e?.preventDefault();
    if (!replyText.trim()) return;

    try {
      setSending(true);
      const res = await supportApi.sendMessage(id, { body: replyText.trim() });
      setTicket(res.data.ticket);
      setMessages(res.data.messages || []);
      setReplyText('');
      toast.success('Reply sent');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      const res = await supportApi.updateStatus(id, { status: newStatus });
      setTicket(res.data.ticket);
      toast.success(newStatus === 'closed' ? 'Ticket closed' : 'Ticket reopened');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update ticket status');
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <DashboardLayout title="Support Ticket">
        <div className="max-w-4xl mx-auto space-y-4 animate-pulse">
          <div className="h-8 w-32 bg-surface border border-border rounded-lg" />
          <div className="h-40 bg-surface rounded-2xl border border-border" />
          <div className="h-64 bg-surface rounded-2xl border border-border" />
        </div>
      </DashboardLayout>
    );
  }

  if (!ticket) {
    return (
      <DashboardLayout title="Support Ticket">
        <div className="max-w-4xl mx-auto p-12 text-center space-y-4">
          <h2 className="text-xl font-bold text-text-primary">Ticket Not Found</h2>
          <button
            onClick={() => navigate('/support')}
            className="px-4 py-2 bg-dash-primary text-white font-bold rounded-xl text-xs"
          >
            Back to Support Desk
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const statusBadge = STATUS_BADGES[ticket.status] || STATUS_BADGES.open;
  const isClosed = ticket.status === 'closed';

  return (
    <DashboardLayout title={`Ticket #${ticket.id}`}>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate('/support')}
            className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary hover:text-text-primary transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Support Tickets</span>
          </button>

          <div className="flex items-center gap-2">
            {ticket.status === 'resolved' && (
              <button
                onClick={() => handleStatusChange('open')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-success-soft text-success border border-success/30 text-xs font-bold hover:bg-success-soft/80 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reopen Ticket</span>
              </button>
            )}

            {!isClosed && (
              <button
                onClick={() => handleStatusChange('closed')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-border text-text-secondary hover:text-text-primary text-xs font-semibold hover:bg-surface-hover transition"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Close Ticket</span>
              </button>
            )}
          </div>
        </div>

        {/* Ticket Detail Card */}
        <div className="p-6 rounded-2xl bg-surface border border-border shadow-pb-card space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-text-muted">#{ticket.id}</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${statusBadge.className}`}>
                {statusBadge.label}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-page border border-border text-text-secondary capitalize font-medium">
                {ticket.category}
              </span>
            </div>
            <div className="text-xs text-text-muted">Created: {formatDate(ticket.created_at)}</div>
          </div>

          <div>
            <h1 className="text-xl font-bold text-text-primary">{ticket.subject}</h1>
            {ticket.donation_title && (
              <p className="text-xs text-dash-primary font-medium mt-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                <span>Related Donation: {ticket.donation_title}</span>
              </p>
            )}
          </div>
        </div>

        {/* Messages Thread */}
        <div className="space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted px-1">Message Thread</h2>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {messages.map((msg) => {
              const isAdmin = msg.sender_role === 'admin';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isAdmin ? 'justify-start' : 'justify-end'}`}
                >
                  {isAdmin && (
                    <div className="w-8 h-8 rounded-full bg-dash-primary-soft border border-dash-primary/30 text-dash-primary flex items-center justify-center shrink-0">
                      <Shield className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-xl space-y-1 ${isAdmin ? 'items-start' : 'items-end'}`}>
                    <div className="flex items-center gap-2 text-[11px] text-text-muted px-1">
                      <span className="font-semibold text-text-secondary">
                        {isAdmin ? (msg.sender_name || 'Support Admin') : 'You'}
                      </span>
                      <span>•</span>
                      <span>{formatDate(msg.created_at)}</span>
                    </div>

                    <div
                      className={`p-4 rounded-2xl text-xs whitespace-pre-wrap leading-relaxed shadow-xs ${
                        isAdmin
                          ? 'bg-surface border border-border text-text-primary rounded-tl-none'
                          : 'bg-dash-primary text-white font-medium rounded-tr-none'
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>

                  {!isAdmin && (
                    <div className="w-8 h-8 rounded-full bg-page border border-border text-text-secondary flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Composer */}
        {isClosed ? (
          <div className="p-4 rounded-2xl bg-surface border border-border text-center text-xs text-text-muted">
            This support ticket has been closed. If you have additional questions, please{' '}
            <button
              onClick={() => navigate('/support/new')}
              className="text-dash-primary font-bold underline hover:text-dash-primary-hover"
            >
              open a new ticket
            </button>
            .
          </div>
        ) : (
          <form onSubmit={handleSendReply} className="p-4 rounded-2xl bg-surface border border-border shadow-pb-card space-y-3">
            <textarea
              rows={3}
              placeholder="Type your reply here..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="w-full bg-page text-text-primary text-xs p-3 rounded-xl border border-border focus:outline-none focus:border-dash-primary resize-y"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handleSendReply(e);
                }
              }}
            />
            <div className="flex items-center justify-between text-xs text-text-muted">
              <span>Press Ctrl+Enter to send</span>
              <button
                type="submit"
                disabled={sending || !replyText.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-dash-primary hover:bg-dash-primary-hover text-white font-bold transition disabled:opacity-50 shadow-xs"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sending ? 'Sending...' : 'Send Reply'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
export default SupportTicketPage;
