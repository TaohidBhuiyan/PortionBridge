import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  User,
  Shield,
  FileText,
  Lock,
  Tag,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Sparkles,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DashboardLayout } from '../components/dashboard';
import { supportApi } from '../services/supportApi';

const CANNED_REPLIES = [
  'Hello! Thank you for contacting PortionBridge Support. We are investigating your issue.',
  'Your request regarding the donation pickup has been updated. Please check your active missions.',
  'We have verified your account details. The issue should now be resolved.',
  'Thank you for reporting this safety concern. Our moderation team is actively reviewing it.',
];

export function AdminSupportTicketPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ticket, setTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [replyText, setReplyText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [targetStatus, setTargetStatus] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const fetchTicket = useCallback(async () => {
    try {
      setLoading(true);
      const res = await supportApi.getAdminTicket(id);
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
      const res = await supportApi.sendAdminMessage(id, {
        body: replyText.trim(),
        isInternal,
        status: targetStatus || undefined,
      });
      setTicket(res.data.ticket);
      setMessages(res.data.messages || []);
      setReplyText('');
      setTargetStatus('');
      toast.success(isInternal ? 'Internal note added' : 'Reply sent to user');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleUpdateTicket = async (fields) => {
    try {
      const res = await supportApi.updateAdminTicket(id, fields);
      setTicket(res.data.ticket);
      toast.success('Ticket updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update ticket');
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
      <DashboardLayout title="Admin Support Ticket">
        <div className="max-w-6xl mx-auto space-y-4 animate-pulse">
          <div className="h-8 w-32 bg-slate-800 rounded-lg" />
          <div className="h-96 bg-slate-900 rounded-2xl border border-slate-800" />
        </div>
      </DashboardLayout>
    );
  }

  if (!ticket) {
    return (
      <DashboardLayout title="Admin Support Ticket">
        <div className="max-w-6xl mx-auto p-12 text-center space-y-4">
          <h2 className="text-xl font-bold text-white">Ticket Not Found</h2>
          <button
            onClick={() => navigate('/admin/support')}
            className="px-4 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs"
          >
            Back to Inbox
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Admin Ticket #${ticket.id}`}>
      <div className="max-w-6xl mx-auto space-y-6">
        <button
          onClick={() => navigate('/admin/support')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Support Inbox</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chat Thread (Left 2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="font-mono text-slate-500">Ticket #{ticket.id}</span>
                <span className="text-slate-400">Created: {formatDate(ticket.created_at)}</span>
              </div>
              <h1 className="text-xl font-bold text-white">{ticket.subject}</h1>
            </div>

            {/* Messages */}
            <div className="space-y-4">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Conversation Thread</h2>

              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
                {messages.map((msg) => {
                  const isAdmin = msg.sender_role === 'admin';
                  const isInternalMsg = msg.is_internal === 1;

                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${isAdmin ? 'justify-start' : 'justify-start'}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          isInternalMsg
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : isAdmin
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {isAdmin ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                      </div>

                      <div className="max-w-xl space-y-1">
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-300">
                            {msg.sender_name || (isAdmin ? 'Admin' : 'User')}
                          </span>
                          {isInternalMsg && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                              INTERNAL NOTE
                            </span>
                          )}
                          <span>•</span>
                          <span>{formatDate(msg.created_at)}</span>
                        </div>

                        <div
                          className={`p-4 rounded-2xl text-xs whitespace-pre-wrap leading-relaxed shadow-sm ${
                            isInternalMsg
                              ? 'bg-amber-950/30 border border-amber-500/40 text-amber-200'
                              : isAdmin
                              ? 'bg-slate-900 border border-emerald-500/30 text-slate-200'
                              : 'bg-slate-800 text-slate-100'
                          }`}
                        >
                          {msg.message}
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Composer */}
            <form onSubmit={handleSendReply} className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsInternal(false)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      !isInternal
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Public Reply to User
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsInternal(true)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      isInternal
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Internal Admin Note
                  </button>
                </div>

                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value)}
                  className="bg-slate-950 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg border border-slate-800"
                >
                  <option value="">Set Status on Send...</option>
                  <option value="in_progress">In Progress</option>
                  <option value="awaiting_user">Awaiting User</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {/* Canned replies dropdown */}
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      setReplyText((prev) => (prev ? prev + '\n' + e.target.value : e.target.value));
                      e.target.value = '';
                    }
                  }}
                  className="bg-slate-950 text-slate-400 text-xs px-2.5 py-1 rounded-lg border border-slate-800 w-full"
                >
                  <option value="">Insert Quick Reply...</option>
                  {CANNED_REPLIES.map((c, i) => (
                    <option key={i} value={c}>
                      {c.slice(0, 60)}...
                    </option>
                  ))}
                </select>
              </div>

              <textarea
                rows={4}
                placeholder={isInternal ? 'Write an internal staff note (never visible to user)...' : 'Type reply to user...'}
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                className={`w-full bg-slate-950 text-slate-100 text-xs p-3 rounded-xl border focus:outline-none resize-y ${
                  isInternal ? 'border-amber-500/30 focus:border-amber-500' : 'border-slate-800 focus:border-emerald-500'
                }`}
              />

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  {isInternal ? 'Internal notes remain hidden from ticket owner.' : 'User will receive a notification and socket update.'}
                </span>
                <button
                  type="submit"
                  disabled={sending || !replyText.trim()}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition disabled:opacity-50 ${
                    isInternal
                      ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sending ? 'Sending...' : isInternal ? 'Add Internal Note' : 'Send Reply'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Sidebar: Control Panel */}
          <div className="space-y-6">
            {/* Controls Card */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Ticket Management</h3>

              <div className="space-y-3 text-xs">
                {/* Status */}
                <div className="space-y-1">
                  <label className="text-slate-400">Status</label>
                  <select
                    value={ticket.status}
                    onChange={(e) => handleUpdateTicket({ status: e.target.value })}
                    className="w-full bg-slate-950 text-slate-200 p-2 rounded-xl border border-slate-800 capitalize"
                  >
                    <option value="open">Open</option>
                    <option value="in_progress">In Progress</option>
                    <option value="awaiting_user">Awaiting User</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                {/* Priority */}
                <div className="space-y-1">
                  <label className="text-slate-400">Priority</label>
                  <select
                    value={ticket.priority}
                    onChange={(e) => handleUpdateTicket({ priority: e.target.value })}
                    className="w-full bg-slate-950 text-slate-200 p-2 rounded-xl border border-slate-800 capitalize"
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                </div>

                {/* Assigned Admin */}
                <div className="space-y-1">
                  <label className="text-slate-400">Assigned Staff</label>
                  <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 flex items-center justify-between">
                    <span>{ticket.assigned_admin_name || 'Unassigned'}</span>
                    <button
                      onClick={() => handleUpdateTicket({ assignedAdminId: ticket.assigned_admin_id ? null : 1 })}
                      className="text-[11px] text-emerald-400 underline font-medium"
                    >
                      {ticket.assigned_admin_id ? 'Unassign' : 'Assign to Me'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* User Details Card */}
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-300">Ticket Requester</h3>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold">
                  {ticket.user_name ? ticket.user_name.charAt(0) : 'U'}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-100">{ticket.user_name}</div>
                  <div className="text-xs text-slate-400">{ticket.user_email}</div>
                  <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 capitalize">
                    Role: {ticket.user_role}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
export default AdminSupportTicketPage;
