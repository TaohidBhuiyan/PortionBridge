import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, CheckCircle2 } from 'lucide-react';
import { resolveMediaUrl } from '../../utils/mediaUrl';

/**
 * ProfileCard — Premium full-bleed portrait profile card inspired by modern
 * executive dashboards (Crextio style). Features the user's photo as the full
 * hero element with ambient gradient overlays, online status, verified badge,
 * and a glassmorphic pill badge.
 */
export function ProfileCard({ user, roleLabel = 'Donor', tone = 'donor', stats = [], action }) {
  const [imgError, setImgError] = useState(false);

  const displayName = user?.name || 'User';
  const initials = displayName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const photoUrl = resolveMediaUrl(
    user?.photo || user?.profile_photo || user?.profile_picture
  );

  const profileLink =
    tone === 'volunteer'
      ? '/volunteer/profile'
      : tone === 'admin'
      ? '/admin/settings'
      : '/donor/profile';

  // Fallback background gradient when no photo is uploaded
  const fallbackBg = {
    donor: 'bg-gradient-to-br from-rose-950 via-slate-900 to-pink-950',
    volunteer: 'bg-gradient-to-br from-sky-950 via-slate-900 to-teal-950',
    admin: 'bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950',
  }[tone] || 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900';

  // Primary stat pill label (e.g. "5 Donations" or "Donor")
  const pillLabel =
    stats && stats.length > 0 && Number(stats[0]?.value) > 0
      ? `${stats[0].value} ${stats[0].label.replace(/Total\s*/i, '')}`
      : roleLabel;

  return (
    <div className="relative w-full h-full min-h-[230px] sm:min-h-[245px] max-h-[260px] rounded-3xl overflow-hidden shadow-pb-card border border-border/40 group bg-slate-950 flex flex-col justify-between">
      {/* Full-bleed Photo Background or Stylized Fallback */}
      {photoUrl && !imgError ? (
        <img
          src={photoUrl}
          alt={displayName}
          onError={() => setImgError(true)}
          className="absolute inset-0 w-full h-full object-cover object-[center_20%] group-hover:scale-105 transition-transform duration-700 ease-out"
        />
      ) : (
        <div className={`absolute inset-0 w-full h-full flex flex-col items-center justify-center ${fallbackBg} p-5`}>
          <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white text-2xl font-bold mb-2.5 shadow-xl">
            {initials}
          </div>
          <Link
            to={profileLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-medium backdrop-blur-md border border-white/20 transition-all shadow-sm"
          >
            <Camera size={12} />
            <span>Upload Photo</span>
          </Link>
        </div>
      )}

      {/* Dual-Zone Targeted Gradient Scrims — Keeps Face & Center Crystal Clear While Ensuring Text & Badges Pop */}
      <div className="absolute top-0 inset-x-0 h-16 bg-gradient-to-b from-black/60 via-black/20 to-transparent pointer-events-none" />
      <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
      <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-3xl pointer-events-none" />

      {/* Top Header Row (Status Indicator & Edit Action) */}
      <div className="relative z-10 p-3.5 sm:p-4 flex items-center justify-between pointer-events-auto">
        {/* Active Status Pill */}
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-black/40 backdrop-blur-md border border-white/20 text-[11px] font-medium text-white shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>Active</span>
        </span>

        {/* Change Photo / Edit Button */}
        <Link
          to={profileLink}
          title="Change profile photo"
          aria-label="Change profile photo"
          className="inline-flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-white/90 hover:text-white transition-all shadow-sm hover:scale-110 active:scale-95"
        >
          <Camera size={13} />
        </Link>
      </div>

      {/* Bottom Identity Row (Name, Subtitle, and Glass Pill Badge) */}
      <div className="relative z-10 p-3.5 sm:p-4 flex items-end justify-between gap-2.5 pointer-events-auto">
        {/* Left: Name & Subtitle */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight leading-tight drop-shadow-md truncate">
              {displayName}
            </h3>
            {(user?.email_verified || user?.is_verified !== false) && (
              <CheckCircle2
                size={16}
                className="text-sky-400 fill-sky-400/20 shrink-0 drop-shadow-sm"
                title="Verified Account"
              />
            )}
          </div>
          <p className="text-[11px] sm:text-xs text-white/85 font-medium truncate drop-shadow-sm">
            {roleLabel} {user?.email ? `• ${user.email}` : ''}
          </p>
        </div>

        {/* Right: Glassmorphic Stat / Role Pill */}
        <div className="shrink-0">
          {action ? (
            action
          ) : (
            <Link
              to={profileLink}
              title="View Profile"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/35 backdrop-blur-md border border-white/25 text-xs font-semibold text-white shadow-sm transition-all hover:scale-105 active:scale-95"
            >
              <span>{pillLabel}</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
