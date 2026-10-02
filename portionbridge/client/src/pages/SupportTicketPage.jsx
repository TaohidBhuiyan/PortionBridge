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
  open: { label: 'Open', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  in_progress: { label: 'In Progress', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  awaiting_user: { label: 'Awaiting Your Response', bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  resolved: { label: 'Resolved', bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
  closed: { label: 'Closed', bg: 'bg-slate-800 text-slate-500 border-slate-700' },
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
          <div className="h-8 w-32 bg-slate-800 rounded-lg" />
          <div className="h-40 bg-slate-900 rounded-2xl border border-slate-800" />
          <div className="h-64 bg-slate-900 rounded-2xl border border-slate-800" />
        </div>
      </DashboardLayout>
    );
  }

  if (!ticket) {
    return (
      <DashboardLayout title="Support Ticket">
        <div className="max-w-4xl mx-auto p-12 text-center space-y-4">
          <h2 className="text-xl font-bold text-white">Ticket Not Found</h2>
          <button
            onClick={() => navigate('/support')}
            className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs"
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
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Support Tickets</span>
          </button>

          <div className="flex items-center gap-2">
            {ticket.status === 'resolved' && (
              <button
                onClick={() => handleStatusChange('open')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold hover:bg-emerald-500/20 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reopen Ticket</span>
              </button>
            )}

            {!isClosed && (
              <button
                onClick={() => handleStatusChange('closed')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold hover:bg-slate-700 transition"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Close Ticket</span>
              </button>
            )}
          </div>
        </div>

        {/* Ticket Detail Card */}
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-sm font-mono text-slate-500">#{ticket.id}</span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-medium ${statusBadge.bg}`}>
                {statusBadge.label}
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-md bg-slate-800 text-slate-300 capitalize font-medium">
                {ticket.category}
              </span>
            </div>
            <div className="text-xs text-slate-500">Created: {formatDate(ticket.created_at)}</div>
          </div>

          <div>
            <h1 className="text-xl font-bold text-white">{ticket.subject}</h1>
            {ticket.donation_title && (
              <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                <span>Related Donation: {ticket.donation_title}</span>
              </p>
            )}
          </div>
        </div>

        {/* Messages Thread */}
        <div className="space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 px-1">Message Thread</h2>

          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {messages.map((msg) => {
              const isAdmin = msg.sender_role === 'admin';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isAdmin ? 'justify-start' : 'justify-end'}`}
                >
                  {isAdmin && (
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shrink-0">
                      <Shield className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-xl space-y-1 ${isAdmin ? 'items-start' : 'items-end'}`}>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 px-1">
                      <span className="font-semibold text-slate-300">
                        {isAdmin ? (msg.sender_name || 'Support Admin') : 'You'}
                      </span>
                      <span>•</span>
                      <span>{formatDate(msg.created_at)}</span>
                    </div>

                    <div
                      className={`p-4 rounded-2xl text-xs whitespace-pre-wrap leading-relaxed shadow-sm ${
                        isAdmin
                          ? 'bg-slate-900 border border-emerald-500/30 text-slate-200 rounded-tl-none'
                          : 'bg-emerald-600 text-slate-950 font-medium rounded-tr-none'
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>

                  {!isAdmin && (
                    <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
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
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-center text-xs text-slate-400">
            This support ticket has been closed. If you have additional questions, please{' '}
            <button
              onClick={() => navigate('/support/new')}
              className="text-emerald-400 underline font-semibold hover:text-emerald-300"
            >
              open a new ticket
            </button>
            .
          </div>
        ) : (
          <form onSubmit={handleSendReply} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
            <textarea
              rows={3}
              placeholder="Type your reply here..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              className="w-full bg-slate-950 text-slate-100 text-xs p-3 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500/50 resize-y"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  handleSendReply(e);
                }
              }}
            />
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Press Ctrl+Enter to send</span>
              <button
                type="submit"
                disabled={sending || !replyText.trim()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition disabled:opacity-50"
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
