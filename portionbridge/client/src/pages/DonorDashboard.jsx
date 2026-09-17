import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout, ProfileCard } from '../components/dashboard';
import { useAuth } from '../context/AuthContext';
import {
  StatisticsCards,
  QuickActions,
  ActiveDonations,
  RecentActivities,
  ImpactSummary,
  RatingReminders,
} from '../components/dashboard/donor';
import { donationApi } from '../services/donationApi';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

/**
 * DonorDashboard — Streamlined, Clean & Organized Donor Experience
 * Aligned with Landing Page, Login, and Register brand aesthetics.
 */
export function DonorDashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    let cancelled = false;
    donationApi.getDonorHistorySummary().then((result) => {
      if (!cancelled && result.success) setSummary(result.data);
    });
    return () => { cancelled = true; };
  }, []);

  const stats = summary
    ? [
        { label: 'Total Donations', value: summary.total || 0 },
        { label: 'Completed', value: summary.completed || 0 },
        { label: 'Pending', value: summary.pending || 0 },
      ]
    : [];

  return (
    <DashboardLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6 pb-8 max-w-7xl mx-auto"
      >
        {/* Rating Reminders (shows only when donor has pending delivery ratings) */}
        <motion.div variants={itemVariants}>
          <RatingReminders />
        </motion.div>

        {/* 1. Hero Overview Row — ProfileCard (Untouched layout) + Active Donations */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch"
        >
          {/* ProfileCard — Maintained exactly as requested */}
          <div className="lg:col-span-1 h-full flex flex-col">
            <ProfileCard user={user} roleLabel="Donor" tone="donor" stats={stats} />
          </div>

          {/* Active Donations Progress Tracker */}
          <div className="lg:col-span-2 h-full flex flex-col">
            <ActiveDonations />
          </div>
        </motion.div>

        {/* 2. Quick Action Hub */}
        <motion.div variants={itemVariants}>
          <QuickActions />
        </motion.div>

        {/* 3. Performance & Impact Metrics */}
        <motion.div variants={itemVariants}>
          <StatisticsCards />
        </motion.div>

        {/* 4. Activity Timeline & Ecological Impact (2-Column Organized Grid) */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start"
        >
          {/* Recent Donation Activity */}
          <div className="space-y-6">
            <RecentActivities />
          </div>

          {/* Ecological Impact Sanctuary */}
          <div className="space-y-6">
            <ImpactSummary />
          </div>
        </motion.div>

      </motion.div>
    </DashboardLayout>
  );
}

export default DonorDashboard;
