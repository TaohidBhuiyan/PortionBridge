import { MapPin, Users, Shield, ChevronRight } from 'lucide-react';
import { useState } from 'react';

/**
 * Team Card Component
 * Displays team information with distance, member count, and leader info
 */
const TeamCard = ({ team, onViewDetails, onRequestPickup, disabled = false }) => {
  const [showDetails, setShowDetails] = useState(false);

  const getLeaderImage = () => {
    if (team.leader_photo) {
      return team.leader_photo;
    }
    return null;
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatDistance = (distance) => {
    const num = parseFloat(distance);
    if (num < 1) {
      return `${Math.round(num * 1000)}m`;
    }
    return `${num.toFixed(1)}km`;
  };

  const calculateETA = (distance) => {
    const num = parseFloat(distance);
    // Assume average speed of 20 km/h for urban areas
    const timeInMinutes = (num / 20) * 60;
    if (timeInMinutes < 60) {
      return `${Math.round(timeInMinutes)} min`;
    }
    return `${Math.round(timeInMinutes / 60)} hr`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        {/* Team Icon */}
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
            <Users className="w-7 h-7 text-white" />
          </div>
        </div>

        {/* Team Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                {team.name}
              </h3>
              
              {team.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                  {team.description}
                </p>
              )}
            </div>

            {/* Distance Badge */}
            <div className="flex-shrink-0 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded-lg text-sm font-medium">
              {formatDistance(team.distance)}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>{team.member_count} members</span>
            </div>
            
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              <span>{calculateETA(team.distance)} away</span>
            </div>

            <div className="flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              <span>{team.coverage_radius ? `${team.coverage_radius}km` : 'N/A'} coverage</span>
            </div>
          </div>

          {/* Leader Info */}
          <div className="flex items-center gap-2 mt-2">
            {getLeaderImage() ? (
              <img
                src={getLeaderImage()}
                alt={team.leader_name}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium text-gray-600 dark:text-gray-300">
                {getInitials(team.leader_name)}
              </div>
            )}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Led by {team.leader_name}
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
        >
          {showDetails ? 'Hide Details' : 'View Details'}
        </button>
        
        <button
          onClick={() => onRequestPickup?.(team)}
          disabled={disabled}
          className="flex-1 px-3 py-2 text-sm bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
        >
          Request Team
        </button>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Team Size</p>
              <p className="font-medium text-gray-900 dark:text-white">{team.member_count} members</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Coverage Radius</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {team.coverage_radius ? `${team.coverage_radius}km` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Distance</p>
              <p className="font-medium text-gray-900 dark:text-white">{formatDistance(team.distance)}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">ETA</p>
              <p className="font-medium text-gray-900 dark:text-white">{calculateETA(team.distance)}</p>
            </div>
          </div>

          {team.description && (
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Description</p>
              <p className="text-sm text-gray-700 dark:text-gray-300">{team.description}</p>
            </div>
          )}

          <button
            onClick={() => onViewDetails?.(team)}
            className="w-full flex items-center justify-center gap-1 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
          >
            View Team Profile
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default TeamCard;
