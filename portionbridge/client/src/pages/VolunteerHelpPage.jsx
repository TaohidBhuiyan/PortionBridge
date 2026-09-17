import { useState } from 'react';
import { ChevronDown, ChevronUp, MessageCircle, HelpCircle, ArrowLeft, Search, LifeBuoy, ShieldAlert, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/dashboard';

export function VolunteerHelpPage() {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const faqs = [
    {
      question: 'How do I see donation requests near me?',
      answer: 'Go to Opportunities and set your base address if you haven\'t already — nearby donations are filtered by real distance from that address, not just city name. You can adjust your search radius (1-50 km) right on that page.',
    },
    {
      question: 'Why do I need to set my address before browsing?',
      answer: 'Your address is what "nearby" is measured from, both for the donations you see and for donors finding you through Discover Volunteers. Set or update it any time from your dashboard\'s "My Base Location" card.',
    },
    {
      question: 'What\'s the difference between my base address and live location?',
      answer: 'Your base address is a fixed point you set once, used to filter nearby opportunities. Live location only turns on during an active mission (after you start it), so the donor can see you en route — it\'s never used to change your base address.',
    },
    {
      question: 'What are the steps after I accept a donation?',
      answer: 'Accepted → Schedule Pickup (pick a date/time) → Start Mission (mark on the way) → Mark Picked Up. After that, the donor confirms completion on their end — you\'ll see "Waiting for the donor to confirm" until they do.',
    },
    {
      question: 'How does a team-assigned mission work?',
      answer: 'If your team leader assigns a donation to you specifically, it shows up in your own Active Missions and Dashboard just like one you accepted individually — schedule/start/pick-up all work the same way, and only you (not other team members) can act on it.',
    },
    {
      question: 'Why can\'t I leave my team or be removed while I have an active pickup?',
      answer: 'To avoid leaving a donation stuck with nobody able to act on it, the app blocks leaving/removal while you have an active assignment (accepted through picked-up). Finish or reassign it first.',
    },
    {
      question: 'How are my completed pickups and rating counted?',
      answer: 'Your dashboard stats, history, and leaderboard ranking all count donations you actually completed — whether accepted individually or assigned to you through a team. Donor ratings you receive count the same way.',
    },
    {
      question: 'How do I contact support?',
      answer: 'For immediate assistance, use the in-app messaging feature to contact our support team. You can also email us at support@portionbridge.org. We typically respond within 24 hours.',
    },
  ];

  const filteredFaqs = faqs.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Hero Header */}
        <div className="pb-volunteer-hero rounded-2xl p-6 sm:p-7 relative overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/volunteer/dashboard')}
              className="p-2.5 hover:bg-surface/80 rounded-xl transition-colors shrink-0 border border-border/60 bg-surface/60"
              aria-label="Back to dashboard"
            >
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight flex items-center gap-2">
                Help & Guidelines <Sparkles className="w-5 h-5 text-dash-primary" />
              </h1>
              <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
                Find answers to common questions about volunteering, mission steps, and team rules.
              </p>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="pb-glass-card rounded-2xl p-4 sm:p-5 border border-border/60 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted w-4 h-4" />
            <input
              type="text"
              placeholder="Search help topics, pickup steps, team rules..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-border rounded-xl bg-surface text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-dash-primary/40 focus:border-dash-primary transition-all"
            />
          </div>
        </div>

        {/* Accordions */}
        <div className="space-y-3">
          {filteredFaqs.length === 0 ? (
            <div className="pb-glass-card rounded-2xl p-8 text-center border border-border/60 text-text-muted">
              <HelpCircle className="w-10 h-10 mx-auto mb-2 opacity-40 text-dash-primary" />
              <p className="text-sm font-semibold text-text-primary">No matching help topics found</p>
              <p className="text-xs text-text-secondary mt-1">Try adjusting your search terms or contact support.</p>
            </div>
          ) : (
            filteredFaqs.map((faq, index) => (
              <div
                key={index}
                className="pb-glass-card rounded-2xl border border-border/70 overflow-hidden shadow-sm transition-all"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left hover:bg-dash-primary-soft/30 transition-colors gap-3"
                >
                  <span className="font-bold text-sm sm:text-base text-text-primary">{faq.question}</span>
                  {openIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-dash-primary shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-text-muted shrink-0" />
                  )}
                </button>
                {openIndex === index && (
                  <div className="px-5 pb-5 pt-1 border-t border-border/40">
                    <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Support Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="pb-glass-card rounded-2xl p-5 border border-dash-primary/30 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2.5 text-dash-primary mb-2">
                <LifeBuoy size={20} />
                <h3 className="font-bold text-sm">Need Direct Assistance?</h3>
              </div>
              <p className="text-xs text-text-secondary">
                Have a question that isn't answered here? Chat with our support team in real time.
              </p>
            </div>
            <button
              onClick={() => navigate('/messages')}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-dash-primary text-white text-xs font-bold rounded-xl hover:bg-dash-primary-hover shadow-sm transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              Contact Support Chat
            </button>
          </div>

          <div className="pb-glass-card rounded-2xl p-5 border border-amber-500/30 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center gap-2.5 text-amber-500 mb-2">
                <ShieldAlert size={20} />
                <h3 className="font-bold text-sm">Emergency Mission Hotline</h3>
              </div>
              <p className="text-xs text-text-secondary">
                For urgent safety or food handling emergencies during active pickups.
              </p>
            </div>
            <a
              href="mailto:support@portionbridge.org"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 text-xs font-bold rounded-xl hover:bg-amber-500/20 transition-colors"
            >
              Email Emergency Team
            </a>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
