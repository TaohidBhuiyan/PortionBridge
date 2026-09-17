import { CheckCircle, Clock, TrendingUp, TrendingDown, Activity, Award } from 'lucide-react';

const VolunteerStatistics = ({ statistics }) => {
  const stats = statistics || {};

  const formatPercentage = (value) => {
    if (value === undefined || value === null) return 'N/A';
    return `${value.toFixed(1)}%`;
  };

  const getRateColor = (rate) => {
    if (rate === undefined || rate === null) return 'text-text-muted';
    if (rate >= 90) return 'text-emerald-500';
    if (rate >= 70) return 'text-amber-500';
    return 'text-rose-500';
  };

  return (
    <div className="pb-glass-card rounded-2xl p-6 border border-border/60 shadow-sm space-y-6">
      <h2 className="text-lg font-bold text-text-primary tracking-tight flex items-center gap-2">
        <Activity className="w-5 h-5 text-dash-primary" /> Performance & Mission Analytics
      </h2>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Completed Pickups */}
        <div className="pb-glass-card pb-hover-lift rounded-xl p-4 border border-emerald-500/20 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <CheckCircle className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-text-muted uppercase">Completed</span>
          </div>
          <p className="text-2xl font-extrabold text-text-primary tracking-tight">
            {stats.completed_pickups || 0}
          </p>
          <p className="text-[11px] font-semibold text-emerald-500 mt-1">Successful rescues</p>
        </div>

        {/* Active Pickups */}
        <div className="pb-glass-card pb-hover-lift rounded-xl p-4 border border-blue-500/20 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-text-muted uppercase">Active</span>
          </div>
          <p className="text-2xl font-extrabold text-text-primary tracking-tight">
            {stats.active_pickups || 0}
          </p>
          <p className="text-[11px] font-semibold text-blue-500 mt-1">In progress now</p>
        </div>

        {/* Acceptance Rate */}
        <div className="pb-glass-card pb-hover-lift rounded-xl p-4 border border-purple-500/20 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-text-muted uppercase">Acceptance</span>
          </div>
          <p className={`text-2xl font-extrabold tracking-tight ${getRateColor(stats.acceptance_rate)}`}>
            {formatPercentage(stats.acceptance_rate)}
          </p>
          <p className="text-[11px] font-semibold text-purple-500 mt-1">Reliability score</p>
        </div>

        {/* Cancellation Rate */}
        <div className="pb-glass-card pb-hover-lift rounded-xl p-4 border border-amber-500/20 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-text-muted uppercase">Cancel Rate</span>
          </div>
          <p className={`text-2xl font-extrabold tracking-tight ${getRateColor(100 - (stats.cancellation_rate || 0))}`}>
            {formatPercentage(stats.cancellation_rate)}
          </p>
          <p className="text-[11px] font-semibold text-amber-500 mt-1">Unfulfilled requests</p>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="pt-4 border-t border-border/60 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface/80 border border-border/60">
          <div className="w-9 h-9 bg-dash-primary-soft rounded-lg flex items-center justify-center text-dash-primary shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-muted">Total Assignments</p>
            <p className="text-base font-extrabold text-text-primary">
              {stats.total_assignments || 0}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface/80 border border-border/60">
          <div className="w-9 h-9 bg-dash-primary-soft rounded-lg flex items-center justify-center text-dash-primary shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-muted">Avg Response Time</p>
            <p className="text-base font-extrabold text-text-primary">
              &lt; 15 mins
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 p-3 rounded-xl bg-surface/80 border border-border/60">
          <div className="w-9 h-9 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500 shrink-0">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs font-semibold text-text-muted">On-Time Fulfillment</p>
            <p className="text-base font-extrabold text-emerald-500">
              98.5%
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolunteerStatistics;
