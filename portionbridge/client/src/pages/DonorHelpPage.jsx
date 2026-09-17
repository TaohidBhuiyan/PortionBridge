import { useState, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  MessageCircle,
  HelpCircle,
  ArrowLeft,
  Search,
  Mail,
  ShieldCheck,
  Zap,
  Award,
  Package,
  Sparkles,
  PhoneCall,
  CheckCircle2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { DashboardLayout } from '../components/dashboard';

/**
 * DonorHelpPage - Premium Help Center & FAQ Hub
 */
export function DonorHelpPage() {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All Topics', icon: Sparkles },
    { id: 'posting', label: 'Posting & Pickup', icon: Package },
    { id: 'impact', label: 'Points & Ranking', icon: Award },
    { id: 'safety', label: 'Safety & Privacy', icon: ShieldCheck },
  ];

  const faqs = [
    {
      id: 1,
      category: 'posting',
      question: 'How do I post a donation?',
      answer: 'Navigate to your dashboard and click "Create Donation". Select whether it is Food or Clothing, enter item quantity, specify pickup location/address, and upload photos to help volunteers quickly identify your items.',
    },
    {
      id: 2,
      category: 'posting',
      question: 'What happens after I post a donation?',
      answer: 'Your donation request becomes visible to verified volunteers in your area. When a volunteer claims your mission, you will receive an instant notification and can coordinate directly via in-app chat.',
    },
    {
      id: 3,
      category: 'posting',
      question: 'How do I track my donation status in real-time?',
      answer: 'You can monitor live progress on your "My Donations" page. Statuses update seamlessly from Pending → Accepted → On the Way → Picked Up → Completed.',
    },
    {
      id: 4,
      category: 'posting',
      question: 'Can I cancel or modify a donation?',
      answer: 'Yes, you can edit or cancel a donation anytime before a volunteer accepts it. Once accepted, you can coordinate any time changes directly with the assigned volunteer or reach out to support.',
    },
    {
      id: 5,
      category: 'impact',
      question: 'How are Impact Points calculated?',
      answer: 'You earn 50 Impact Points for every completed donation mission! Additional bonus points are awarded for quick handovers and verified high-quality food contributions.',
    },
    {
      id: 6,
      category: 'impact',
      question: 'Where can I see my community rank?',
      answer: 'Check out the Donor Leaderboard page from the main sidebar navigation to see your overall rank, weekly contribution metrics, and milestone badges.',
    },
    {
      id: 7,
      category: 'safety',
      question: 'Can I remain anonymous on the public leaderboard?',
      answer: 'Absolutedly! Go to Settings > Privacy and toggle off "Show on Leaderboard". Your contributions will still count towards total community impact while keeping your identity private.',
    },
    {
      id: 8,
      category: 'safety',
      question: 'What if I encounter an issue with a pickup or volunteer?',
      answer: 'Safety is our top priority. You can flag any issue from the donation details page or report a volunteer directly via the Help Center. Our safety team responds within 15 minutes.',
    },
    {
      id: 9,
      category: 'safety',
      question: 'How are my personal addresses kept secure?',
      answer: 'Your precise home address is only revealed to the verified volunteer who accepts your donation mission. We encrypt all address records and never share your data publicly.',
    },
  ];

  // Filter FAQs based on search and category tab
  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
      const matchesSearch =
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const toggleFAQ = (id) => {
    setOpenIndex(openIndex === id ? null : id);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('support@portionbridge.org');
    toast.success('Support email copied to clipboard!');
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto pb-12 space-y-8">
        {/* Hero Banner with Search */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-dash-primary via-indigo-600 to-purple-600 p-6 sm:p-10 text-white shadow-xl">
          <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute left-1/4 -top-12 w-48 h-48 bg-purple-400/20 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl">
            <button
              onClick={() => navigate('/donor/dashboard')}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs font-medium backdrop-blur-md transition-colors mb-4"
            >
              <ArrowLeft size={14} />
              <span>Back to Dashboard</span>
            </button>

            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-white/15 rounded-2xl backdrop-blur-md">
                <HelpCircle className="w-7 h-7 text-amber-300" />
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
                Donor Help & Support Center
              </h1>
            </div>

            <p className="text-white/80 text-sm sm:text-base mt-2 mb-6">
              Have questions about posting donations, earning impact points, or volunteer pickups? Search our knowledge base below.
            </p>

            {/* Instant Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
              <input
                type="text"
                placeholder="Search questions, keywords, policies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white text-gray-900 placeholder:text-gray-400 text-sm font-medium shadow-lg focus:outline-none focus:ring-4 focus:ring-amber-300/50 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Quick Contact Options Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-surface rounded-2xl p-5 border border-border shadow-pb-card hover:border-dash-primary/30 transition-all flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-xl bg-dash-primary-soft text-dash-primary">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-text-primary text-sm">24/7 Live Support Chat</h3>
                <p className="text-xs text-text-muted">Instant response from our team</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/messages')}
              className="w-full py-2.5 px-4 bg-dash-primary text-white rounded-xl text-xs font-bold hover:bg-dash-primary-hover transition-colors flex items-center justify-center gap-2"
            >
              <span>Open In-App Chat</span>
              <Zap size={14} className="text-amber-300" />
            </button>
          </div>

          <div className="bg-surface rounded-2xl p-5 border border-border shadow-pb-card hover:border-emerald-500/30 transition-all flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-text-primary text-sm">Email Support</h3>
                <p className="text-xs text-text-muted">Detailed query resolution</p>
              </div>
            </div>
            <button
              onClick={handleCopyEmail}
              className="w-full py-2.5 px-4 border border-border bg-page hover:bg-surface-hover text-text-primary rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
              <span>support@portionbridge.org</span>
            </button>
          </div>

          <div className="bg-surface rounded-2xl p-5 border border-border shadow-pb-card hover:border-amber-500/30 transition-all flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 rounded-xl bg-amber-500/10 text-amber-500">
                <PhoneCall className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-text-primary text-sm">Urgent Helpline</h3>
                <p className="text-xs text-text-muted">Active pickup escalations</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-semibold px-3 py-2 bg-emerald-500/10 rounded-xl justify-center">
              <CheckCircle2 size={14} />
              <span>Avg. response under 15 mins</span>
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    isSelected
                      ? 'bg-dash-primary text-white shadow-md'
                      : 'bg-surface border border-border text-text-secondary hover:bg-surface-hover hover:text-text-primary'
                  }`}
                >
                  <Icon size={15} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Accordion FAQ List */}
          <div className="space-y-3">
            {filteredFaqs.length === 0 ? (
              <div className="bg-surface rounded-2xl border border-border p-8 text-center">
                <HelpCircle className="w-12 h-12 text-text-muted mx-auto mb-3" />
                <h3 className="text-base font-bold text-text-primary">No matching questions found</h3>
                <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
                  Try clearing your search term or switching tabs to find what you are looking for.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('all');
                  }}
                  className="mt-4 px-4 py-2 bg-dash-primary text-white text-xs font-semibold rounded-xl"
                >
                  Reset Search
                </button>
              </div>
            ) : (
              filteredFaqs.map((faq) => {
                const isOpen = openIndex === faq.id;
                return (
                  <div
                    key={faq.id}
                    className={`bg-surface rounded-2xl border transition-all overflow-hidden ${
                      isOpen
                        ? 'border-dash-primary/40 shadow-pb-card ring-1 ring-dash-primary/20'
                        : 'border-border hover:border-border/80'
                    }`}
                  >
                    <button
                      onClick={() => toggleFAQ(faq.id)}
                      className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-surface-hover/50 gap-4"
                    >
                      <span className="font-bold text-sm text-text-primary flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-dash-primary shrink-0" />
                        {faq.question}
                      </span>
                      <div className="p-1 rounded-lg bg-surface-hover text-text-secondary shrink-0">
                        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 pt-0 border-t border-border/40 mt-1 animate-in fade-in duration-200">
                        <p className="text-text-secondary text-xs sm:text-sm leading-relaxed pt-3">
                          {faq.answer}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
