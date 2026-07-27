import React, { useState } from "react";

const PRIMARY = "oklch(60.6% 0.25 292.717)";

/**
 * Avatar component for displaying user profile images with fallback initials
 * @param {Object} item - Object containing name and optional photo
 * @param {string} className - Additional CSS classes
 */
export function Avatar({ item, className }) {
  const [broken, setBroken] = useState(false);
  const initials = item.name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  
  if (!item.photo || broken) {
    return (
      <div 
        className={`${className} rounded-full flex items-center justify-center text-white font-semibold shrink-0`} 
        style={{ background: PRIMARY }}
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
