import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DashboardLayout, ProfileCard } from '../components/dashboard';
import { useAuth } from '../context/AuthContext';
import {
  WelcomeHeader,
  StatisticsCards,
  QuickActions,
  ActiveDonations,
  RecentActivities,
  LeaderboardWidget,
  ProfileCompletion,
  ImpactSummary,
  NotificationPreview,
} from '../components/dashboard/donor';
import { AchievementsPanel } from '../components/common/AchievementsPanel';
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
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

/**
 * DonorDashboard — Ultra-Premium Donor Experience
 * Combines sleek top WelcomeHeader with the full-bleed ProfileCard and Active Donations hero,
 * followed by elevated KPIs, interactive action hub, impact sanctuary, and community feeds.
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
        { label: 'Total Donations', value: summary.totalDonations || 0 },
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
        className="space-y-6 pb-8"
      >
        {/* 1. Sleek Compact Welcome Header Ribbon */}
        <motion.div variants={itemVariants}>
          <WelcomeHeader user={user} summary={summary} />
        </motion.div>

        {/* 2. Hero Row — ProfileCard (exact size from screenshot) + Active Donations */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch"
        >
          <div className="lg:col-span-1 h-full flex flex-col">
            <ProfileCard user={user} roleLabel="Donor" tone="donor" stats={stats} />
          </div>
          <div className="lg:col-span-2 h-full flex flex-col">
            <ActiveDonations />
          </div>
        </motion.div>

        {/* 3. Performance & Impact Statistics */}
        <motion.div variants={itemVariants}>
          <StatisticsCards />
        </motion.div>

        {/* 4. Interactive Quick Actions Hub */}
        <motion.div variants={itemVariants}>
          <QuickActions />
        </motion.div>

        {/* 5. Ecological Impact Sanctuary + Live Activity Timeline */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch"
        >
          <div className="h-full flex flex-col">
            <ImpactSummary />
          </div>
          <div className="h-full flex flex-col">
            <RecentActivities />
          </div>
        </motion.div>

        {/* 6. Community Ranks, Profile Health, Achievements & Real-Time Feed */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch"
        >
          <div className="h-full flex flex-col">
            <LeaderboardWidget />
          </div>
          <div className="h-full flex flex-col">
            <ProfileCompletion />
          </div>
          <div className="h-full flex flex-col">
            <AchievementsPanel userId={user?.id} userRole="donor" />
          </div>
          <div className="h-full flex flex-col">
            <NotificationPreview />
          </div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}

export default DonorDashboard;
