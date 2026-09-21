import { User, Star, MapPin, ShieldCheck, HeartHandshake } from 'lucide-react';
import { Avatar } from '../common/Avatar';

/**
 * VolunteerCard — displays assigned volunteer profile info with rating stars and team badge
 */
export function VolunteerCard({ volunteer }) {
  if (!volunteer) {
    return (
      <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-page/60 border border-dashed border-border/80">
        <div className="w-11 h-11 rounded-full bg-surface border border-border flex items-center justify-center shrink-0 shadow-pb-subtle">
          <User size={20} className="text-text-muted" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <p className="text-sm font-semibold text-text-primary">No volunteer assigned yet</p>
          </div>
          <p className="text-xs text-text-secondary leading-relaxed">
            Nearby volunteers will be notified to accept this pickup request.
          </p>
        </div>
      </div>
    );
  }

  const { name, team_name, rating, completed_pickups } = volunteer;

  return (
    <div className="p-3.5 rounded-xl bg-gradient-to-br from-surface to-page border border-border/80 shadow-pb-subtle space-y-3">
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <Avatar item={volunteer} tone="dash" className="w-12 h-12 text-base ring-2 ring-dash-primary/20 shadow-sm" />
          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-success ring-2 ring-surface flex items-center justify-center text-white text-[9px]">
            <ShieldCheck size={10} />
          </span>
        </div>
        <div className="min-w-0 flex-1 pt-0.5">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-bold text-text-primary truncate">{name}</p>
            <span className="px-2 py-0.5 rounded-full bg-volunteer-soft text-volunteer text-[10px] font-bold uppercase tracking-wider shrink-0">
              Volunteer
            </span>
          </div>
          {team_name && (
            <p className="text-xs text-text-secondary flex items-center gap-1 mt-1 truncate">
              <MapPin size={12} className="text-dash-primary shrink-0" />
              <span className="font-medium text-text-primary">{team_name}</span>
            </p>
          )}
        </div>
      </div>

      {(rating !== undefined || completed_pickups !== undefined) && (
        <div className="flex items-center justify-between pt-2.5 border-t border-border/60 text-xs">
          {rating !== undefined && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-warning-soft/60">
              <Star size={13} className="text-warning fill-warning" />
              <span className="font-bold text-text-primary">{rating.toFixed(1)}</span>
              <span className="text-text-muted text-[11px]">rating</span>
            </div>
          )}
          {completed_pickups !== undefined && (
            <div className="flex items-center gap-1 text-text-secondary font-medium px-2 py-1 rounded-md bg-page">
              <HeartHandshake size={13} className="text-dash-primary" />
              <span>{completed_pickups} pickups</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

