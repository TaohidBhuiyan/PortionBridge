import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SkeletonCard } from '../skeletons';
import { EmptyState } from '../EmptyState';
import { ErrorState } from '../ErrorState';
import { Package, Clock, User, Calendar, ArrowRight } from 'lucide-react';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api/v1';

/**
 * ActiveDonations widget showing latest active donations
 * Redesigned for compact, professional appearance
 */
export function ActiveDonations() {
  const navigate = useNavigate();

  // Static fallback data for display when backend is not available
  const donations = [
    {
      id: 1,
      title: 'Fresh vegetables for community kitchen',
      category: 'food',
      status: 'pending',
      createdAt: '2024-01-15',
    },
    {
      id: 2,
      title: 'Winter clothes collection',
      category: 'clothes',
      status: 'scheduled',
      createdAt: '2024-01-14',
    },
    {
      id: 3,
      title: 'Excess rice from restaurant',
      category: 'food',
      status: 'on_the_way',
      createdAt: '2024-01-13',
    },
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pending', color: 'bg-warning-50 text-warning-700 dark:bg-warning-950/30 dark:text-warning-400' },
      scheduled: { label: 'Scheduled', color: 'bg-info-50 text-info-700 dark:bg-info-950/30 dark:text-info-400' },
      on_the_way: { label: 'On the Way', color: 'bg-primary-50 text-primary-700 dark:bg-primary-950/30 dark:text-primary-400' },
      picked_up: { label: 'Picked Up', color: 'bg-success-50 text-success-700 dark:bg-success-950/30 dark:text-success-400' },
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (donations.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5 mb-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">Active Donations</h2>
        <EmptyState
          icon={Package}
          title="No active donations"
          description="You don't have any active donations at the moment."
          actionLabel="Create a Donation"
          onAction={() => navigate('/donation/create')}
          size="small"
        />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 p-5 mb-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Active Donations</h2>
        <button 
          onClick={() => navigate('/donor/my-donations')}
          className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium focus:outline-none focus:underline"
        >
          View All
        </button>
      </div>

      <div className="space-y-3">
        {donations.map((donation) => (
          <div
            key={donation.id}
            onClick={() => navigate(`/donations/${donation.id}`)}
            className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all duration-200"
          >
            <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center shrink-0">
              <Package size={16} className="text-primary-600 dark:text-primary-400" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div>
                  <h3 className="font-medium text-sm text-slate-900 dark:text-slate-50 mb-1 truncate">
                    {donation.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="capitalize">{donation.category}</span>
                    <span className="text-slate-300 dark:text-slate-600">•</span>
                    {getStatusBadge(donation.status)}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1">
                  <Calendar size={12} />
                  <span>{formatDate(donation.createdAt)}</span>
                </div>
              </div>
            </div>

            <button 
              onClick={(e) => { e.stopPropagation(); navigate(`/donations/${donation.id}`); }}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-primary-600 dark:hover:text-primary-400 transition-colors shrink-0 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
