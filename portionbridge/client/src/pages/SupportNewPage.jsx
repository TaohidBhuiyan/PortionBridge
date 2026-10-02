import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  UserCheck,
  Package,
  Truck,
  Wrench,
  ShieldAlert,
  MessageSquare,
  HelpCircle,
  AlertTriangle,
  Info,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { DashboardLayout } from '../components/dashboard';
import { supportApi } from '../services/supportApi';
import { donationApi } from '../services/donationApi';

const CATEGORIES = [
  { id: 'account', label: 'Account & Login', icon: UserCheck, desc: 'Issues with profile, password, verification' },
  { id: 'donation', label: 'Donation Issue', icon: Package, desc: 'Errors or questions regarding a posted item' },
  { id: 'pickup', label: 'Pickup & Delivery', icon: Truck, desc: 'Volunteer delays, wrong location, scheduling' },
  { id: 'technical', label: 'Technical Bug', icon: Wrench, desc: 'App errors, broken pages, missing notifications' },
  { id: 'safety', label: 'Safety & Policy', icon: ShieldAlert, desc: 'Report misconduct, food safety concern, harassment' },
  { id: 'feedback', label: 'Feedback & Ideas', icon: MessageSquare, desc: 'Suggestions to improve PortionBridge' },
  { id: 'other', label: 'General Inquiry', icon: HelpCircle, desc: 'Any other question not listed above' },
];

export function SupportNewPage() {
  const navigate = useNavigate();
  const [category, setCategory] = useState('donation');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [donationId, setDonationId] = useState('');
  const [donations, setDonations] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadDonations() {
      try {
        const res = await donationApi.getMyDonations();
        setDonations(res.data?.donations || res.donations || []);
      } catch (err) {
        // Silently ignore if non-donor or fails
      }
    }
    loadDonations();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim()) {
      return toast.error('Please enter a subject');
    }
    if (!body.trim()) {
      return toast.error('Please describe your issue');
    }

    try {
      setSubmitting(true);
      const res = await supportApi.createTicket({
        category,
        subject: subject.trim(),
        body: body.trim(),
        donationId: donationId ? parseInt(donationId, 10) : null,
      });

      toast.success('Support ticket created successfully!');
      const newTicketId = res.data?.ticket?.id;
      if (newTicketId) {
        navigate(`/support/${newTicketId}`);
      } else {
        navigate('/support');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Create Support Ticket">
      <div className="max-w-5xl mx-auto space-y-6">
        <button
          onClick={() => navigate('/support')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Tickets</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Form */}
          <div className="lg:col-span-2 space-y-6">
            <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-6">
              <div className="space-y-1">
                <h1 className="text-xl font-bold text-white">Open a Support Ticket</h1>
                <p className="text-slate-400 text-xs">
                  Fill out the form below and an administrator will respond as soon as possible.
                </p>
              </div>

              {/* Category Picker */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-300">Select Category</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {CATEGORIES.map((cat) => {
                    const Icon = cat.icon;
                    const selected = category === cat.id;
                    return (
                      <div
                        key={cat.id}
                        onClick={() => setCategory(cat.id)}
                        className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-3 ${
                          selected
                            ? 'bg-emerald-500/10 border-emerald-500/50 text-slate-100'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${selected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-900 text-slate-500'}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="text-xs font-semibold">{cat.label}</div>
                          <div className="text-[11px] text-slate-500 line-clamp-1">{cat.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Optional Donation Selector */}
              {donations.length > 0 && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-300">Related Donation (Optional)</label>
                  <select
                    value={donationId}
                    onChange={(e) => setDonationId(e.target.value)}
                    className="w-full bg-slate-950 text-slate-200 text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="">-- None / General --</option>
                    {donations.map((d) => (
                      <option key={d.id} value={d.id}>
                        #{d.id} - {d.title} ({d.status})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Subject */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-medium text-slate-300">Subject</label>
                  <span className="text-slate-500">{subject.length}/150</span>
                </div>
                <input
                  type="text"
                  maxLength={150}
                  placeholder="Brief description of the issue..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 text-xs px-3.5 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Body */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-medium text-slate-300">Description</label>
                  <span className="text-slate-500">{body.length}/5000</span>
                </div>
                <textarea
                  rows={6}
                  maxLength={5000}
                  placeholder="Provide detailed information so we can assist you quickly..."
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full bg-slate-950 text-slate-100 text-xs p-3.5 rounded-xl border border-slate-800 focus:outline-none focus:border-emerald-500/50 resize-y"
                />
              </div>

              {category === 'safety' && (
                <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <span>
                    Safety issues are automatically flagged with <strong>High Priority</strong> for urgent admin review.
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/support')}
                  className="px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-semibold text-slate-400 hover:text-white transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Submitting...' : 'Submit Ticket'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Sidebar / Tips */}
          <div className="space-y-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider">
                <Info className="w-4 h-4" />
                <span>Tips for fast resolution</span>
              </div>
              <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside leading-relaxed">
                <li>Be specific about what happened and when.</li>
                <li>If related to a pickup, include the donation ID.</li>
                <li>Check your active tickets before opening duplicates.</li>
                <li>Urgent safety reports receive priority handling.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
export default SupportNewPage;
