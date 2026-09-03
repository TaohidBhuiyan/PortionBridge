import { User, Star, MapPin } from 'lucide-react';
import { Avatar } from '../common/Avatar';

/**
 * VolunteerCard — shows real volunteer info when assigned. Only renders
 * rating/completed-pickups if the caller actually provides them; never
 * fabricates a status message. A working chat entry point already exists
 * elsewhere on the donation details page when a volunteer is assigned, so
 * this card doesn't duplicate it with a disabled placeholder button.
 */
export function VolunteerCard({ volunteer }) {
  if (!volunteer) {
    return (
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-page border border-border flex items-center justify-center shrink-0">
          <User size={22} className="text-text-secondary" />
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">No volunteer assigned yet</p>
          <p className="text-xs text-text-secondary">
            We'll update this donation once one becomes available.
          </p>
        </div>
      </div>
    );
  }

  const { name, team_name, rating, completed_pickups } = volunteer;

  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <Avatar item={volunteer} tone="dash" className="w-12 h-12 text-base" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">{name}</p>
          {team_name && (
            <p className="text-xs text-text-secondary flex items-center gap-1 truncate">
              <MapPin size={12} />
              {team_name}
            </p>
          )}
        </div>
      </div>

      {(rating !== undefined || completed_pickups !== undefined) && (
        <div className="flex items-center gap-4">
          {rating !== undefined && (
            <div className="flex items-center gap-1.5">
              <Star size={14} className="text-warning fill-warning" />
              <span className="text-xs font-medium text-text-primary">{rating.toFixed(1)}</span>
            </div>
          )}
          {completed_pickups !== undefined && (
            <div className="text-xs text-text-secondary">
              {completed_pickups} completed pickups
            </div>
          )}
        </div>
      )}
    </div>
  );
}
