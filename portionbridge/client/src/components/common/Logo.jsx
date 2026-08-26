
const PRIMARY = "oklch(60.6% 0.25 292.717)";

/**
 * Logo component for PortionBridge branding
 * @param {string} className - Additional CSS classes
 * @param {boolean} rounded - Whether to use rounded corners
 */
export function Logo({ className = "w-7 h-7", rounded = true }) {
  return (
    <svg viewBox="0 0 100 100" className={className}>
      {rounded && <rect width="100" height="100" rx="20" fill={PRIMARY} />}
      <path
        d="M22 42 C22 24 34 14 50 14 C66 14 78 24 78 42"
        stroke="white"
        strokeWidth="7"
        fill="none"
        strokeLinecap="round"
      />
      <line x1="38" y1="34" x2="38" y2="82" stroke="white" strokeWidth="7" strokeLinecap="round" />
      <line x1="50" y1="34" x2="50" y2="82" stroke="white" strokeWidth="7" strokeLinecap="round" />
      <line x1="62" y1="34" x2="62" y2="82" stroke="white" strokeWidth="7" strokeLinecap="round" />
    </svg>
  );
}
