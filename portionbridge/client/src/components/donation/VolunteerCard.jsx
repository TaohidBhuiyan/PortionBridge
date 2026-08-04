import React from 'react';
import { User, Star, MapPin, MessageSquare, ExternalLink } from 'lucide-react';

/**
 * VolunteerCard component for displaying volunteer information
 */
export function VolunteerCard({ volunteer }) {
  if (!volunteer) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <User size={32} className="text-gray-400 dark:text-gray-500" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">No Volunteer Assigned</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Waiting for a volunteer to accept this donation
            </p>
          </div>
        </div>
      </div>
    );
  }

  const {
    name,
    profile_photo,
    team_name,
    rating,
    completed_pickups,
    current_status,
  } = volunteer;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 p-6">
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        {profile_photo ? (
          <img
            src={profile_photo}
            alt={name}
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 dark:from-purple-950/30 dark:to-purple-900/30 flex items-center justify-center">
            <User size={32} className="text-purple-400 dark:text-purple-600" />
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
            {name}
          </h3>
          {team_name && (
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <MapPin size={14} />
              {team_name}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        {rating !== undefined && (
          <div className="flex items-center gap-2">
            <Star size={16} className="text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {rating.toFixed(1)}
            </span>
          </div>
        )}
        {completed_pickups !== undefined && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {completed_pickups} completed
          </div>
        )}
      </div>

      {/* Current Status */}
      {current_status && (
        <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-950/20 rounded-xl">
          <p className="text-sm text-purple-700 dark:text-purple-300">
            {current_status}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          disabled
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed transition-colors text-sm font-medium"
          title="Chat coming soon"
        >
          <MessageSquare size={16} />
          Chat
        </button>
        <button
          disabled
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed transition-colors text-sm font-medium"
          title="Profile coming soon"
        >
          <ExternalLink size={16} />
          Profile
        </button>
      </div>
    </div>
  );
}
