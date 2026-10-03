import { useState } from "react";
import { resolveMediaUrl } from "../../utils/mediaUrl";

/**
 * Avatar component for displaying user profile images with fallback initials
 * @param {Object} item - Object containing name and optional photo
 * @param {string} className - Additional CSS classes
 * @param {"brand"|"dash"} tone - Which theme's accent color to use for the
 *   fallback background: "brand" (default, purple) for landing-page contexts,
 *   "dash" (sky-blue) for dashboard contexts. Existing callers are unaffected.
 */
export function Avatar({ item, donor, volunteer, className = "", tone = "brand" }) {
  const [broken, setBroken] = useState(false);
  const target = item || donor || volunteer || {};
  const name = target.name || target.reviewer_name || target.donor_name || target.volunteer_name || "User";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  const bgVar = tone === "dash"
    ? "var(--color-dash-primary, #0284c7)"
    : "var(--color-primary, oklch(60.6% 0.25 292.717))";

  // The API/DB uses `profile_photo` (manual upload), `profile_picture` (synced from Google OAuth),
  // or `reviewer_photo` / `photo`
  const photoUrl = resolveMediaUrl(
    target.photo || target.profile_photo || target.profile_picture || target.reviewer_photo || target.avatar
  );

  if (!photoUrl || broken) {
    return (
      <div
        className={`${className} rounded-full flex items-center justify-center text-white font-semibold shrink-0 select-none`}
        style={{ background: bgVar }}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={photoUrl}
      alt={name}
      onError={() => setBroken(true)}
      className={`${className} rounded-full object-cover shrink-0`}
    />
  );
}
