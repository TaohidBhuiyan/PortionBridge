import { useState } from 'react';
import { ChevronDown, ChevronUp, MessageCircle, HelpCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/dashboard';

/**
 * DonorHelpPage - FAQ and help page for donors
 * Features accordion-style answers and link to messages
 */
export function DonorHelpPage() {
  const navigate = useNavigate();
  const [openIndex, setOpenIndex] = useState(null);

  const faqs = [
    {
      question: 'How do I post a donation?',
      answer: 'Navigate to your dashboard and click "Post Donation". Fill in the required details including the type of donation (food or clothing), quantity, pickup location, and preferred time. You can also add photos to help volunteers identify your donation.',
    },
    {
      question: 'What happens after I post a donation?',
      answer: 'Your donation will be visible to verified volunteers in your area. Once a volunteer claims your donation, you\'ll receive a notification. You can then coordinate the pickup time and location through the in-app chat.',
    },
    {
      question: 'How do I track my donation status?',
      answer: 'You can track your donation status in real-time from your dashboard. The status updates from "Pending" to "Accepted" when a volunteer claims it, then to "On the Way" when the volunteer is en route, and finally to "Completed" when the pickup is done.',
    },
    {
      question: 'Can I cancel a donation?',
      answer: 'Yes, you can cancel a donation as long as it hasn\'t been accepted by a volunteer yet. Go to your donations list, find the donation, and click "Cancel". Once accepted, cancellations require coordination with the assigned volunteer.',
    },
    {
      question: 'How are points calculated?',
      answer: 'You earn 50 impact points for each completed donation. Your total points are displayed on your profile and the public leaderboard. The more you donate, the higher your ranking!',
    },
    {
      question: 'Can I remain anonymous on the leaderboard?',
      answer: 'Yes! You can opt out of the public leaderboard by going to Settings > Privacy and toggling off "Show on Leaderboard". Your donations will still be tracked, but your name won\'t appear publicly.',
    },
    {
      question: 'What if I have an issue with a volunteer?',
      answer: 'If you experience any issues with a volunteer, you can report them through the app. Go to the donation details, find the volunteer section, and click "Report". Our team will review the report and take appropriate action.',
    },
    {
      question: 'How do I contact support?',
      answer: 'For immediate assistance, use the in-app messaging feature to contact our support team. You can also email us at support@portionbridge.org. We typically respond within 24 hours.',
    },
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <DashboardLayout>
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/donor/dashboard')}
          className="p-2 hover:bg-surface-hover rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-dash-primary focus:ring-offset-2"
          aria-label="Back to dashboard"
        >
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-3">
            <HelpCircle className="w-7 h-7 text-dash-primary" />
            Help Center
          </h1>
          <p className="text-text-secondary mt-1 text-sm">
            Find answers to common questions about using PortionBridge
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, index) => (
          <div
            key={index}
            className="bg-surface rounded-xl border border-border overflow-hidden"
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-surface-hover transition-colors"
            >
              <span className="font-medium text-text-primary">{faq.question}</span>
              {openIndex === index ? (
                <ChevronUp className="w-5 h-5 text-text-secondary shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-text-secondary shrink-0" />
              )}
            </button>
            {openIndex === index && (
              <div className="px-4 pb-4 pt-0">
                <p className="text-text-secondary leading-relaxed">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-8 bg-dash-primary-soft rounded-xl border border-dash-primary/20 p-6">
        <h3 className="font-semibold text-dash-primary mb-2">Still need help?</h3>
        <p className="text-text-secondary mb-4">
          Can't find what you're looking for? Contact our support team directly.
        </p>
        <button
          onClick={() => navigate('/messages')}
          className="inline-flex items-center gap-2 px-4 py-2 bg-dash-primary text-white rounded-lg hover:bg-dash-primary-hover transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Contact Support
        </button>
      </div>
    </div>
    </DashboardLayout>
  );
}
