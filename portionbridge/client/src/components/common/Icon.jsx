import React from "react";

const ICON_PATHS = {
  food: "M4 3v8a3 3 0 003 3v7M4 3a1 1 0 00-1 1v6a1 1 0 001 1M7 3v8M4 3h3M14 3c-2 2-2 5-2 7 0 2 1 3 2 3v8m0-18c2 2 2 5 2 7 0 2-1 3-2 3",
  shirt: "M8 3l-5 3 2 4 2-1v11h10V9l2 1 2-4-5-3-2 2h-4l-2-2z",
  donor: "M12 21s-7-4.35-9.5-8.8C1 9 2.5 5.5 6 5c2-.3 3.5.7 6 3 2.5-2.3 4-3.3 6-3 3.5.5 5 4 3.5 7.2C19 16.65 12 21 12 21z",
  volunteer: "M17 20a4 4 0 00-10 0M12 12a4 4 0 100-8 4 4 0 000 8zM21 20a3 3 0 00-4-2.83M3 20a3 3 0 014-2.83",
  pin: "M12 21s7-6.5 7-12a7 7 0 10-14 0c0 5.5 7 12 7 12z M12 11.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z",
  bolt: "M13 2L4 14h6l-1 8 9-12h-6l1-8z",
  check: "M20 6L9 17l-5-5",
  x: "M18 6L6 18M6 6l12 12",
};

/**
 * Icon component for displaying SVG icons
 * @param {string} name - Icon name from ICON_PATHS
 * @param {string} className - Additional CSS classes
 */
export function Icon({ name, className = "" }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      className={className} 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="1.7" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d={ICON_PATHS[name] || ""} />
    </svg>
  );
}
