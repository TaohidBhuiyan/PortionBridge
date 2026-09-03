import { useState, useEffect, useCallback } from 'react';
import { MapPin, Clock, Star, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { volunteerDiscoveryApi } from '../../../services/volunteerDiscoveryApi';

/**
 * Auto Assign Recommendation Component
 * Displays the system's recommended volunteer with reasons
 */
const AutoAssignRecommendation = ({ latitude, longitude, onConfirm, onAlternativeSelect }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recommendation, setRecommendation] = useState(null);

  const fetchRecommendation = useCallback(async () => {
    setLoading(true);
    setError(null);

    const result = await volunteerDiscoveryApi.getRecommendedVolunteer({
      latitude,
      longitude,
    });

    if (result.success) {
      setRecommendation(result.data.volunteer);
    } else {
      setError(result.error);
    }

    setLoading(false);
  }, [latitude, longitude]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount pattern used throughout this codebase
    fetchRecommendation();
  }, [fetchRecommendation]);

  const formatDistance = (dist) => {
    if (!dist) return 'N/A';
    const num = parseFloat(dist);
    if (num < 1) return `${Math.round(num * 1000)}m`;
    return `${num.toFixed(1)}km`;
  };

  const calculateETA = (dist) => {
    if (!dist) return 'N/A';
    const num = parseFloat(dist);
    const timeInMinutes = (num / 20) * 60;
    if (timeInMinutes < 60) return `${Math.round(timeInMinutes)} min`;
    return `${Math.round(timeInMinutes / 60)} hr`;
  };

  const getProfileImage = () => {
    if (recommendation?.profile_photo) return recommendation.profile_photo;
    if (recommendation?.profile_picture) return recommendation.profile_picture;
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

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-dash-primary animate-spin" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Finding the best volunteer...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <div className="flex items-center gap-3 text-danger">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
        <button
          onClick={fetchRecommendation}
          className="mt-4 px-4 py-2 bg-dash-primary hover:bg-dash-primary-hover text-white rounded-lg transition-colors text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!recommendation) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
          <AlertCircle className="w-5 h-5" />
          <p>No volunteers available nearby. Please try manual selection.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-success/30 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <CheckCircle className="w-5 h-5 text-success" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Recommended Volunteer
        </h3>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Volunteer Info */}
        <div className="flex items-start gap-4 flex-1">
          {getProfileImage() ? (
            <img
              src={getProfileImage()}
              alt={recommendation.name}
              className="w-16 h-16 rounded-full object-cover border-2 border-white dark:border-gray-700 shadow-lg"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-dash-primary flex items-center justify-center text-white font-bold text-xl border-2 border-white dark:border-gray-700 shadow-lg">
              {getInitials(recommendation.name)}
            </div>
          )}

          <div className="flex-1">
            <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
              {recommendation.name}
            </h4>

            <div className="flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-warning fill-yellow-500" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {recommendation.rating || 'N/A'}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-500">•</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {recommendation.total_pickups || 0} pickups
              </span>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <MapPin className="w-4 h-4" />
                <span>{formatDistance(recommendation.distance)}</span>
              </div>
              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <Clock className="w-4 h-4" />
                <span>ETA: {calculateETA(recommendation.distance)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Reasons */}
        <div className="md:w-64">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Why this volunteer?
          </p>
          <ul className="space-y-1">
            {recommendation.reasons?.map((reason, index) => (
              <li key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <CheckCircle className="w-3 h-3 text-success" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-6 pt-6 border-t border-success/30">
        <button
          onClick={() => onConfirm(recommendation)}
          className="flex-1 px-4 py-2 bg-success hover:opacity-90 text-white rounded-lg transition-colors font-medium"
        >
          Confirm Assignment
        </button>
        <button
          onClick={() => onAlternativeSelect?.()}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
        >
          View Alternatives
        </button>
      </div>
    </div>
  );
};

export default AutoAssignRecommendation;
