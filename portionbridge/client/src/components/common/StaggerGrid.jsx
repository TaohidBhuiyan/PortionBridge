import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * StaggerGrid - Wrapper for list/grid stagger animations
 * Provides staggered entrance animation for children
 * Respects prefers-reduced-motion for accessibility
 */
export function StaggerGrid({ children, className = '', staggerDelay = 0.05 }) {
  const prefersReducedMotion = useReducedMotion();

  const containerVariants = prefersReducedMotion
    ? {
        hidden: { opacity: 1 },
        visible: { opacity: 1 },
      }
    : {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      };

  const itemVariants = prefersReducedMotion
    ? {
        hidden: { opacity: 1 },
        visible: { opacity: 1 },
      }
    : {
        hidden: { opacity: 0, y: 8 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.2,
            ease: "easeOut",
          },
        },
      };

  const transition = prefersReducedMotion ? { duration: 0 } : {};

  return (
    <motion.div
      className={className}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      transition={transition}
    >
      {React.Children.map(children, (child) => (
        <motion.div variants={itemVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
