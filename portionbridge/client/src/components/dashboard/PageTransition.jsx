import { motion, useReducedMotion } from 'framer-motion';

/**
 * PageTransition — subtle fade + small vertical settle between dashboard
 * routes. Used once in DashboardLayout so every donor/volunteer/admin page
 * gets the same transition without each page wiring up its own.
 *
 * Deliberately restrained: short duration, small distance, no exit
 * animation (avoids a jarring double-render on fast navigation), and
 * fully disabled for prefers-reduced-motion via Framer's built-in hook.
 */
export function PageTransition({ pageKey, children }) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div key={pageKey}>{children}</div>;
  }

  return (
    <motion.div
      key={pageKey}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
}
