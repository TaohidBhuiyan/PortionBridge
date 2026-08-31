import { motion, useReducedMotion } from 'framer-motion';

/**
 * PageTransition - Subtle page transition wrapper
 * Provides a gentle fade and slide effect for page content
 * Respects prefers-reduced-motion for accessibility
 */
export function PageTransition({ children }) {
  const prefersReducedMotion = useReducedMotion();

  const variants = prefersReducedMotion
    ? {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
      }
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
      };

  const transition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.25, ease: "easeOut" };

  return (
    <motion.div
      variants={variants}
      initial="initial"
      animate="animate"
      transition={transition}
    >
      {children}
    </motion.div>
  );
}
