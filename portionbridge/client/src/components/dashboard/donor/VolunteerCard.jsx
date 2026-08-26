import { Clock, Star, CheckCircle, Users, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Volunteer Card Component
 * Displays volunteer information with distance, availability, and stats
 */
const VolunteerCard = ({ volunteer, onRequestPickup, disabled = false }) => {
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);

  const handleVolunteerClick = (volunteerData) => {
    // Save distance for profile page
    if (volunteerData.distance) {
      sessionStorage.setItem('volunteer_distance', volunteerData.distance);
    }
    navigate(`/volunteers/${volunteerData.id}`);
  };

  const getProfileImage = () => {
    if (volunteer.profile_photo) {
      return volunteer.profile_photo;
    }
    if (volunteer.profile_picture) {
      return volunteer.profile_picture;
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

  const getVehicleIcon = (vehicleType) => {
    switch (vehicleType) {
      case 'bicycle':
        return '🚴';
      case 'motorcycle':
        return '🏍️';
      case 'car':
        return '🚗';
      case 'van':
        return '🚐';
      case 'truck':
        return '🚚';
      default:
        return '🚶';
    }
  };

  const isOnline = volunteer.is_online === 1 || volunteer.is_online === true;
  const hasTeam = volunteer.team_id && volunteer.team_name;

  return (
    <div className="bg-surface border border-border rounded-xl p-4 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4 cursor-pointer" onClick={() => handleVolunteerClick(volunteer)}>
        {/* Profile Picture */}
        <div className="relative flex-shrink-0">
          {getProfileImage() ? (
            <img
              src={getProfileImage()}
              alt={volunteer.name}
              className="w-14 h-14 rounded-full object-cover border-2 border-border"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-dash-primary flex items-center justify-center text-white font-semibold text-lg">
              {getInitials(volunteer.name)}
            </div>
          )}
          
          {/* Online Status Indicator */}
          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-surface ${
            isOnline ? 'bg-success' : 'bg-text-secondary'
          }`} />
        </div>

        {/* Volunteer Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-text-primary truncate">
                {volunteer.name}
              </h3>
              
              {hasTeam && (
                <div className="flex items-center gap-1 text-xs text-text-secondary mt-0.5">
                  <Users className="w-3 h-3" />
                  <span className="truncate">{volunteer.team_name}</span>
                </div>
              )}
            </div>

            {/* Distance Badge */}
            <div className="flex-shrink-0 bg-dash-primary-soft text-dash-primary px-2 py-1 rounded-lg text-sm font-medium">
              {formatDistance(volunteer.distance)}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex items-center gap-3 mt-2 text-xs text-text-secondary">
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{calculateETA(volunteer.distance)} away</span>
            </div>
            
            {volunteer.total_pickups > 0 && (
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>{volunteer.total_pickups} pickups</span>
              </div>
            )}

            {volunteer.vehicle_type && (
              <div className="flex items-center gap-1" title={volunteer.vehicle_type}>
                <span className="text-sm">{getVehicleIcon(volunteer.vehicle_type)}</span>
              </div>
            )}
          </div>

          {/* Availability Status */}
          <div className="flex items-center gap-2 mt-2">
            {isOnline ? (
              <span className="flex items-center gap-1 text-xs text-success">
                <Eye className="w-3 h-3" />
                Available Now
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-text-secondary">
                <EyeOff className="w-3 h-3" />
                Offline
              </span>
            )}

            {volunteer.skills && volunteer.skills.length > 0 && (
              <div className="flex items-center gap-1">
                {volunteer.skills.slice(0, 2).map((skill, index) => (
                  <span
                    key={index}
                    className="text-xs px-2 py-0.5 bg-page border border-border text-text-secondary rounded-full"
                  >
                    {skill}
                  </span>
                ))}
                {volunteer.skills.length > 2 && (
                  <span className="text-xs text-text-secondary">
                    +{volunteer.skills.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 mt-4 pt-3 border-t border-border">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDetails(!showDetails);
            }}
            className="flex-1 px-3 py-2 text-sm border border-border text-text-primary hover:bg-surface-hover transition-colors font-medium"
          >
            {showDetails ? 'Hide Details' : 'View Details'}
          </button>
        
        <button
          onClick={() => onRequestPickup?.(volunteer)}
          disabled={disabled || !isOnline}
          className="flex-1 px-3 py-2 text-sm bg-dash-primary hover:bg-dash-primary-hover disabled:bg-page disabled:text-text-secondary disabled:cursor-not-allowed text-white rounded-lg transition-colors font-medium"
        >
          Request Pickup
        </button>
      </div>

      {/* Expanded Details */}
      {showDetails && (
        <div className="mt-4 pt-3 border-t border-border space-y-2">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-text-secondary text-xs">Completed Pickups</p>
              <p className="font-medium text-text-primary">{volunteer.total_pickups || 0}</p>
            </div>
            <div>
              <p className="text-text-secondary text-xs">Rating</p>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-warning fill-warning" />
                <span className="font-medium text-text-primary">
                  {volunteer.rating ? volunteer.rating.toFixed(1) : 'N/A'}
                </span>
              </div>
            </div>
            <div>
              <p className="text-text-secondary text-xs">Coverage Area</p>
              <p className="font-medium text-text-primary">
                {volunteer.coverage_radius ? `${volunteer.coverage_radius}km` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-text-secondary text-xs">Vehicle</p>
              <p className="font-medium text-text-primary">
                {volunteer.vehicle_type || 'N/A'}
              </p>
            </div>
          </div>

          {volunteer.availability && volunteer.availability.length > 0 && (
            <div>
              <p className="text-text-secondary text-xs mb-1">Availability</p>
              <div className="flex flex-wrap gap-1">
                {volunteer.availability.slice(0, 3).map((slot, index) => (
                  <span
                    key={index}
                    className="text-xs px-2 py-1 bg-success-soft text-success rounded-full"
                  >
                    {slot}
                  </span>
                ))}
                {volunteer.availability.length > 3 && (
                  <span className="text-xs text-text-secondary">
                    +{volunteer.availability.length - 3} more
                  </span>
                )}
              </div>
            </div>
          )}

          <button
            onClick={() => handleVolunteerClick(volunteer)}
            className="w-full text-center text-sm text-dash-primary hover:text-dash-primary-hover font-medium"
          >
            View Full Profile
          </button>
        </div>
      )}
    </div>
  );
};

export default VolunteerCard;
