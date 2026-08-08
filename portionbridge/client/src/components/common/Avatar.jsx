import { useState } from "react";

/**
 * Avatar component for displaying user profile images with fallback initials
 * @param {Object} item - Object containing name and optional photo
 * @param {string} className - Additional CSS classes
 * @param {"brand"|"dash"} tone - Which theme's accent color to use for the
 *   fallback background: "brand" (default, purple) for landing-page contexts,
 *   "dash" (sky-blue) for dashboard contexts. Existing callers are unaffected.
 */
export function Avatar({ item, className, tone = "brand" }) {
  const [broken, setBroken] = useState(false);
  const initials = (item?.name || "User").split(" ").map((w) => w[0]).slice(0, 2).join("");
  const bgVar = tone === "dash"
    ? "var(--color-dash-primary, #0284c7)"
    : "var(--color-primary, oklch(60.6% 0.25 292.717))";

  if (!item?.photo || broken) {
    return (
      <div
        className={`${className} rounded-full flex items-center justify-center text-white font-semibold shrink-0`}
        style={{ background: bgVar }}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={item.photo}
      alt={item.name}
      onError={() => setBroken(true)}
      className={`${className} rounded-full object-cover shrink-0`}
    />
  );
}
