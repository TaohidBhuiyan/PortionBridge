import { useState, useEffect } from 'react';
import { MapPin, Clock, Star, CheckCircle, Users, Eye, EyeOff, Loader2 } from 'lucide-react';
import { volunteerDiscoveryApi } from '../../../services/volunteerDiscoveryApi';

/**
 * Volunteer Selection Component
 * Allows donor to manually select a volunteer from nearby options
 */
const VolunteerSelection = ({ latitude, longitude, onSelect, selectedVolunteer }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [volunteers, setVolunteers] = useState([]);

  useEffect(() => {
    fetchVolunteers();
  }, [latitude, longitude]);

  const fetchVolunteers = async () => {
    setLoading(true);
    setError(null);

    const result = await volunteerDiscoveryApi.findNearbyVolunteers({
      latitude,
      longitude,
      radius: 10,
      availableOnly: true,
      onlineOnly: false,
      limit: 20,
      page: 1,
    });

    if (result.success) {
      setVolunteers(result.data.volunteers || []);
    } else {
      setError(result.error);
    }

    setLoading(false);
  };

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

  const getProfileImage = (volunteer) => {
    if (volunteer.profile_photo) return volunteer.profile_photo;
    if (volunteer.profile_picture) return volunteer.profile_picture;
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

  const getVehicleIcon = (vehicleType) => {
    switch (vehicleType) {
      case 'bicycle': return '🚴';
      case 'motorcycle': return '🏍️';
      case 'car': return '🚗';
      case 'van': return '🚐';
      case 'truck': return '🚚';
      default: return '🚶';
    }
  };

  const isSelected = (volunteer) => selectedVolunteer?.id === volunteer.id;

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Finding nearby volunteers...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
          <p>{error}</p>
        </div>
        <button
          onClick={fetchVolunteers}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (volunteers.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <div className="text-center py-8">
          <Users className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">No volunteers available nearby</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Available Volunteers
        </h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {volunteers.length} found
        </span>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {volunteers.map((volunteer) => (
          <button
            key={volunteer.id}
            onClick={() => onSelect(volunteer)}
            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
              isSelected(volunteer)
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            <div className="flex items-start gap-4">
              {/* Profile Photo */}
              <div className="relative flex-shrink-0">
                {getProfileImage(volunteer) ? (
                  <img
                    src={getProfileImage(volunteer)}
                    alt={volunteer.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-semibold">
                    {getInitials(volunteer.name)}
                  </div>
                )}
                
                {/* Online Status */}
                <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${
                  volunteer.is_online ? 'bg-green-500' : 'bg-gray-400'
                }`} />
              </div>

              {/* Volunteer Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-gray-900 dark:text-white truncate">
                    {volunteer.name}
                  </h4>
                  {isSelected(volunteer) && (
                    <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                  )}
                </div>

                {/* Team */}
                {volunteer.team_name && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 truncate">
                    {volunteer.team_name}
                  </p>
                )}

                {/* Stats */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    <span>{volunteer.rating || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{formatDistance(volunteer.distance)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{calculateETA(volunteer.distance)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>{getVehicleIcon(volunteer.vehicle_type)}</span>
                    <span className="capitalize">{volunteer.vehicle_type || 'Walking'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {volunteer.is_online ? (
                      <Eye className="w-3 h-3 text-green-600 dark:text-green-400" />
                    ) : (
                      <EyeOff className="w-3 h-3 text-gray-400" />
                    )}
                    <span>{volunteer.is_online ? 'Online' : 'Offline'}</span>
                  </div>
                </div>

                {/* Active Pickups */}
                {volunteer.active_pickups > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {volunteer.active_pickups} active pickup{volunteer.active_pickups > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Selected Volunteer Summary */}
      {selectedVolunteer && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => onSelect(selectedVolunteer)}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
          >
            Confirm Selection
          </button>
        </div>
      )}
    </div>
  );
};

export default VolunteerSelection;
