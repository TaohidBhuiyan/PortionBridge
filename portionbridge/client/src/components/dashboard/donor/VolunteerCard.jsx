import React, { useState } from 'react';
import { Clock, Star, CheckCircle, Users, Eye, EyeOff, ShieldCheck, MapPin, Zap, ChevronRight, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Volunteer Card Component
 * Displays volunteer information with distance, availability, vehicle, and stats.
 */
const VolunteerCard = ({ volunteer, onViewDetails, onRequestPickup, disabled = false }) => {
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);

  const handleCardClick = () => {
    if (onViewDetails) {
      onViewDetails(volunteer);
    } else {
      if (volunteer.distance) {
        sessionStorage.setItem('volunteer_distance', volunteer.distance);
      }
      navigate(`/volunteers/${volunteer.id}`);
    }
  };

  const getProfileImage = () => {
    return volunteer.profile_photo || volunteer.profile_picture || null;
  };

  const getInitials = (name) => {
    if (!name) return 'V';
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
    if (distance === undefined || distance === null) return '15 min';
    const num = parseFloat(distance);
    const timeInMinutes = (num / 20) * 60;
    if (timeInMinutes < 60) {
      return `${Math.max(5, Math.round(timeInMinutes))} min`;
    }
    return `${Math.round(timeInMinutes / 60)} hr`;
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

  const isOnline = volunteer.is_online === 1 || volunteer.is_online === true;
  const hasTeam = volunteer.team_id && volunteer.team_name;

  return (
    <div className="group relative bg-surface border border-border hover:border-dash-primary/40 rounded-2xl p-5 shadow-pb-card hover:shadow-pb-elevated transition-all duration-300 transform hover:-translate-y-0.5">
      
      {/* Top Banner Highlight (Gradient on hover) */}
      <div className="absolute top-0 left-6 right-6 h-0.5 bg-gradient-to-r from-transparent via-dash-primary/0 to-transparent group-hover:via-dash-primary transition-all duration-500 rounded-full" />

      <div className="flex items-start gap-4 cursor-pointer" onClick={handleCardClick}>
        
        {/* Profile Picture with Online Status Ring */}
        <div className="relative flex-shrink-0">
          <div className={`p-0.5 rounded-2xl ${isOnline ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-emerald-500/20 shadow-md' : 'bg-border'}`}>
            {getProfileImage() ? (
              <img
                src={getProfileImage()}
                alt={volunteer.name}
                className="w-14 h-14 rounded-[14px] object-cover bg-surface"
              />
            ) : (
              <div className="w-14 h-14 rounded-[14px] bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-inner">
                {getInitials(volunteer.name)}
              </div>
            )}
          </div>

          {/* Online Status Indicator */}
          <div 
            className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-surface flex items-center justify-center ${
              isOnline ? 'bg-success' : 'bg-text-muted'
            }`}
            title={isOnline ? 'Online & Ready' : 'Offline'}
          >
            {isOnline && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
          </div>
        </div>

        {/* Volunteer Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-text-primary text-base truncate group-hover:text-dash-primary transition-colors">
                  {volunteer.name}
                </h3>
                <ShieldCheck className="w-4 h-4 text-dash-primary flex-shrink-0" title="Verified Volunteer" />
              </div>
              
              {hasTeam && (
                <div className="flex items-center gap-1 text-xs text-text-secondary mt-0.5">
                  <Users className="w-3 h-3 text-purple-500" />
                  <span className="truncate font-medium text-purple-600 dark:text-purple-400">{volunteer.team_name}</span>
                </div>
              )}
            </div>

            {/* Distance Pill */}
            <div className="flex-shrink-0 bg-dash-primary-soft text-dash-primary border border-dash-primary/20 px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {formatDistance(volunteer.distance)}
            </div>
          </div>

          {/* Quick Stats Pills */}
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-page text-text-secondary font-medium">
              <Clock className="w-3 h-3 text-dash-primary" />
              <span>{calculateETA(volunteer.distance)} away</span>
            </span>

            {volunteer.rating !== undefined && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-warning-soft text-warning font-semibold">
                <Star className="w-3 h-3 fill-warning" />
                <span>{volunteer.rating ? volunteer.rating.toFixed(1) : '5.0'}</span>
              </span>
            )}
            
            {volunteer.total_pickups > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-success-soft text-success font-medium">
                <CheckCircle className="w-3 h-3" />
                <span>{volunteer.total_pickups} pickups</span>
              </span>
            )}

            {volunteer.vehicle_type && (
              <span className="px-2 py-0.5 rounded-md bg-page text-text-secondary font-medium" title={`Vehicle: ${volunteer.vehicle_type}`}>
                {getVehicleIcon(volunteer.vehicle_type)}
              </span>
            )}
          </div>

          {/* Skills / Badges */}
          {volunteer.skills && volunteer.skills.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2.5">
              {volunteer.skills.slice(0, 2).map((skill, index) => (
                <span
                  key={index}
                  className="text-[11px] font-medium px-2 py-0.5 bg-page border border-border text-text-secondary rounded-full"
                >
                  {skill}
                </span>
              ))}
              {volunteer.skills.length > 2 && (
                <span className="text-[10px] font-semibold text-text-muted">
                  +{volunteer.skills.length - 2} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons Bar */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewDetails?.(volunteer);
          }}
          className="flex-1 py-2 px-3 text-xs rounded-xl border border-border text-text-primary hover:bg-surface-hover transition-colors font-semibold flex items-center justify-center gap-1 cursor-pointer"
        >
          <Info className="w-3.5 h-3.5 text-text-muted" />
          <span>Quick View</span>
        </button>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRequestPickup?.(volunteer);
          }}
          disabled={disabled || !isOnline}
          className={`flex-1 py-2 px-3 text-xs rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-1 cursor-pointer ${
            isOnline && !disabled
              ? 'bg-dash-primary hover:bg-dash-primary-hover text-white active:scale-95'
              : 'bg-page text-text-muted border border-border cursor-not-allowed'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>{isOnline ? 'Request Pickup' : 'Offline'}</span>
        </button>
      </div>

      {/* Expanded Quick Stats Dropdown if toggled */}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-border space-y-2 animate-fadeIn">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-page rounded-lg">
              <p className="text-text-muted text-[10px] uppercase font-bold">Total Pickups</p>
              <p className="font-semibold text-text-primary mt-0.5">{volunteer.total_pickups || 0}</p>
            </div>
            <div className="p-2 bg-page rounded-lg">
              <p className="text-text-muted text-[10px] uppercase font-bold">Rating</p>
              <p className="font-semibold text-text-primary mt-0.5 flex items-center gap-1">
                <Star className="w-3 h-3 text-warning fill-warning" />
                {volunteer.rating ? volunteer.rating.toFixed(1) : '5.0'}
              </p>
            </div>
            <div className="p-2 bg-page rounded-lg">
              <p className="text-text-muted text-[10px] uppercase font-bold">Coverage Radius</p>
              <p className="font-semibold text-text-primary mt-0.5">
                {volunteer.coverage_radius ? `${volunteer.coverage_radius} km` : '10 km'}
              </p>
            </div>
            <div className="p-2 bg-page rounded-lg">
              <p className="text-text-muted text-[10px] uppercase font-bold">Vehicle</p>
              <p className="font-semibold text-text-primary mt-0.5 capitalize">
                {volunteer.vehicle_type || 'On Foot'}
              </p>
            </div>
          </div>

          <button
            onClick={() => handleCardClick()}
            className="w-full py-1.5 text-center text-xs text-dash-primary hover:text-dash-primary-hover font-semibold flex items-center justify-center gap-1"
          >
            <span>View Full Volunteer Profile</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default VolunteerCard;
