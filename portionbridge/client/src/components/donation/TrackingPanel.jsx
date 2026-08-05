import { useState, useEffect } from 'react';
import { MapPin, Navigation, Clock, Car, Phone, AlertCircle } from 'lucide-react';
import { calculateETA, formatETA } from '../../hooks/useDonationTracking';
import VolunteerMap from '../dashboard/donor/VolunteerMap';

/**
 * TrackingPanel - Displays live pickup tracking information
 * Shows volunteer status, ETA, distance, and map
 */
export function TrackingPanel({ donation, volunteer, volunteerLocation }) {
  const [eta, setEta] = useState(null);
  const [distance, setDistance] = useState(null);

  useEffect(() => {
    if (volunteerLocation && donation?.pickup_location) {
      // Calculate distance between volunteer and pickup location
      // This is a simplified calculation - in production, use proper geocoding
      const dist = calculateDistance(
        volunteerLocation.latitude,
        volunteerLocation.longitude,
        // Default to Dhaka coordinates if pickup location not geocoded
        23.8103,
        90.4125
      );
      setDistance(dist);
      setEta(calculateETA(dist));
    }
  }, [volunteerLocation, donation]);

  const handleContactVolunteer = () => {
    // Placeholder for contact functionality
    alert('Contact functionality coming soon');
  };

  const getStatusMessage = () => {
    switch (donation?.status) {
      case 'scheduled':
        return 'Pickup scheduled';
      case 'on_the_way':
        return 'Volunteer is on the way';
      case 'picked_up':
        return 'Donation picked up';
      case 'completed':
        return 'Pickup completed';
      default:
        return 'Waiting for volunteer';
    }
  };

  const getStatusColor = () => {
    switch (donation?.status) {
      case 'on_the_way':
        return 'text-green-600 dark:text-green-400';
      case 'picked_up':
        return 'text-blue-600 dark:text-blue-400';
      case 'completed':
        return 'text-purple-600 dark:text-purple-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getVehicleIcon = (vehicleType) => {
    switch (vehicleType) {
      case 'car':
        return '🚗';
      case 'motorcycle':
        return '🏍️';
      case 'bicycle':
        return '🚲';
      case 'van':
        return '🚐';
      case 'truck':
        return '🚛';
      default:
        return '🚗';
    }
  };

  // Show empty state if no volunteer assigned
  if (!volunteer && donation?.status === 'pending') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
          <AlertCircle size={20} />
          <p>Waiting for volunteer assignment...</p>
        </div>
      </div>
    );
  }

  // Show empty state if volunteer not on the way yet
  if (donation?.status === 'accepted' || donation?.status === 'scheduled') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 text-gray-500 dark:text-gray-400">
          <Clock size={20} />
          <p>Pickup scheduled for {new Date(donation.pickup_time).toLocaleString()}</p>
        </div>
      </div>
    );
  }

  // Show completed state
  if (donation?.status === 'completed') {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
          <MapPin size={20} />
          <p className="font-medium">Pickup completed successfully</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Live Tracking
          </h3>
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusMessage()}
          </span>
        </div>

        {/* Volunteer Info */}
        {volunteer && (
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-2xl">
              {volunteer.profile_photo ? (
                <img
                  src={volunteer.profile_photo}
                  alt={volunteer.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                '👤'
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">
                {volunteer.name}
              </p>
              {volunteer.team_name && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {volunteer.team_name}
                </p>
              )}
            </div>
            <button
              onClick={handleContactVolunteer}
              className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
              title="Contact volunteer"
            >
              <Phone size={18} className="text-purple-600 dark:text-purple-400" />
            </button>
          </div>
        )}

        {/* Tracking Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <Navigation size={18} className="text-purple-600 dark:text-purple-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Distance</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {distance ? `${distance.toFixed(1)} km` : 'Calculating...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <Clock size={18} className="text-purple-600 dark:text-purple-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">ETA</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {eta ? formatETA(eta) : 'Calculating...'}
              </p>
            </div>
          </div>

          {volunteer?.vehicle_type && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <Car size={18} className="text-purple-600 dark:text-purple-400" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Vehicle</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {getVehicleIcon(volunteer.vehicle_type)} {volunteer.vehicle_type}
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <MapPin size={18} className="text-purple-600 dark:text-purple-400" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Pickup Location</p>
              <p className="font-medium text-gray-900 dark:text-white text-sm line-clamp-1">
                {donation?.pickup_location || 'Not specified'}
              </p>
            </div>
          </div>
        </div>

        {/* Last Updated */}
        {volunteerLocation?.timestamp && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
            Last updated: {new Date(volunteerLocation.timestamp).toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Map */}
      {volunteerLocation && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white">Live Map</h4>
          </div>
          <VolunteerMap
            userLocation={{
              latitude: 23.8103, // Default to Dhaka
              longitude: 90.4125,
            }}
            volunteers={[
              {
                ...volunteer,
                latitude: volunteerLocation.latitude,
                longitude: volunteerLocation.longitude,
                is_online: true,
              },
            ]}
            teams={[]}
            className="h-80"
          />
        </div>
      )}
    </div>
  );
}

/**
 * Simple distance calculation using Haversine formula
 * In production, use proper geocoding for pickup location
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
