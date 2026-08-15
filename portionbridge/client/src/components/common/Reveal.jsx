import { useReveal } from "../hooks/useReveal";

/**
 * Reveal component for scroll-triggered animations
 * @param {React.ReactNode} children - Content to reveal
 * @param {string} className - Additional CSS classes
 * @param {number} delay - Animation delay in ms
 */
export function Reveal({ children, className = "", delay = 0 }) {
  const [ref, visible] = useReveal();
  // Respect prefers-reduced-motion: skip the slide/fade and just show
  // content in place, rather than forcing a motion animation on people
  // who've asked their OS not to.
  const prefersReducedMotion =
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
      : false;

  if (prefersReducedMotion) {
    return <div ref={ref} className={className}>{children}</div>;
  }

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
      }}
    >
      {children}
    </div>
  );
}
