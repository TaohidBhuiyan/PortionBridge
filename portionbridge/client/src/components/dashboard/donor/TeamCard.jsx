import React, { useState } from 'react';
import { MapPin, Users, Shield, ChevronRight, Info, Zap, Award } from 'lucide-react';

/**
 * Team Card Component
 * Displays volunteer squad information with member count, leader info, and coverage.
 */
const TeamCard = ({ team, onViewDetails, onRequestPickup, disabled = false }) => {
  const [showDetails, setShowDetails] = useState(false);

  const getLeaderImage = () => {
    return team.leader_photo || null;
  };

  const getInitials = (name) => {
    if (!name) return 'TS';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDistance = (distance) => {
    if (distance === undefined || distance === null) return 'Nearby';
    const num = parseFloat(distance);
    if (num < 1) {
      return `${Math.round(num * 1000)}m`;
    }
    return `${num.toFixed(1)}km`;
  };

  const calculateETA = (distance) => {
    if (distance === undefined || distance === null) return '20 min';
    const num = parseFloat(distance);
    const timeInMinutes = (num / 20) * 60;
    if (timeInMinutes < 60) {
      return `${Math.max(5, Math.round(timeInMinutes))} min`;
    }
    return `${Math.round(timeInMinutes / 60)} hr`;
  };

  return (
    <div className="group relative bg-surface border border-border hover:border-purple-500/40 rounded-2xl p-5 shadow-pb-card hover:shadow-pb-elevated transition-all duration-300 transform hover:-translate-y-0.5">
      
      {/* Top Banner Highlight */}
      <div className="absolute top-0 left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-purple-500/0 to-transparent group-hover:via-purple-500 transition-all duration-500 rounded-full" />

      <div className="flex items-start gap-4">
        {/* Team Squad Icon */}
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
            <Users className="w-7 h-7 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-surface border-2 border-surface rounded-full p-0.5">
            <Award className="w-3.5 h-3.5 text-purple-600" />
          </div>
        </div>

        {/* Team Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-text-primary text-base truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  {team.name}
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold uppercase tracking-wider">
                  Squad
                </span>
              </div>
              
              {team.description && (
                <p className="text-xs text-text-secondary mt-0.5 truncate">
                  {team.description}
                </p>
              )}
            </div>

            {/* Distance Badge */}
            <div className="flex-shrink-0 bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {formatDistance(team.distance)}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex flex-wrap items-center gap-2 mt-2.5 text-xs">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-page text-text-secondary font-medium">
              <Users className="w-3.5 h-3.5 text-purple-600" />
              <span>{team.member_count || 1} members</span>
            </span>
            
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-page text-text-secondary font-medium">
              <MapPin className="w-3.5 h-3.5 text-dash-primary" />
              <span>{calculateETA(team.distance)} away</span>
            </span>

            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-page text-text-secondary font-medium">
              <Shield className="w-3.5 h-3.5 text-success" />
              <span>{team.coverage_radius ? `${team.coverage_radius}km` : '10km'} coverage</span>
            </span>
          </div>

          {/* Leader Info */}
          {team.leader_name && (
            <div className="flex items-center gap-2 mt-2.5 pt-2 border-t border-border/40">
              {getLeaderImage() ? (
                <img
                  src={getLeaderImage()}
                  alt={team.leader_name}
                  className="w-5 h-5 rounded-full object-cover border border-border"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300 flex items-center justify-center text-[10px] font-bold">
                  {getInitials(team.leader_name)}
                </div>
              )}
              <span className="text-xs text-text-secondary font-medium truncate">
                Led by <strong className="text-text-primary">{team.leader_name}</strong>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
        <button
          onClick={() => onViewDetails?.(team)}
          className="flex-1 py-2 px-3 text-xs rounded-xl border border-border text-text-primary hover:bg-surface-hover transition-colors font-semibold flex items-center justify-center gap-1 cursor-pointer"
        >
          <Info className="w-3.5 h-3.5 text-text-muted" />
          <span>Team Profile</span>
        </button>
        
        <button
          onClick={() => onRequestPickup?.(team)}
          disabled={disabled}
          className={`flex-1 py-2 px-3 text-xs rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer ${
            !disabled
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-purple-500/20 active:scale-95'
              : 'bg-page text-text-muted border border-border cursor-not-allowed'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Request Team</span>
        </button>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-border space-y-2 animate-fadeIn">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-page rounded-lg">
              <p className="text-text-muted text-[10px] uppercase font-bold">Team Size</p>
              <p className="font-semibold text-text-primary mt-0.5">{team.member_count} members</p>
            </div>
            <div className="p-2 bg-page rounded-lg">
              <p className="text-text-muted text-[10px] uppercase font-bold">Coverage Radius</p>
              <p className="font-semibold text-text-primary mt-0.5">
                {team.coverage_radius ? `${team.coverage_radius} km` : '10 km'}
              </p>
            </div>
            <div className="p-2 bg-page rounded-lg">
              <p className="text-text-muted text-[10px] uppercase font-bold">Distance</p>
              <p className="font-semibold text-text-primary mt-0.5">{formatDistance(team.distance)}</p>
            </div>
            <div className="p-2 bg-page rounded-lg">
              <p className="text-text-muted text-[10px] uppercase font-bold">Estimated ETA</p>
              <p className="font-semibold text-text-primary mt-0.5">{calculateETA(team.distance)}</p>
            </div>
          </div>

          <button
            onClick={() => onViewDetails?.(team)}
            className="w-full py-1.5 text-center text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 font-semibold flex items-center justify-center gap-1"
          >
            <span>View Full Squad Profile</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default TeamCard;
