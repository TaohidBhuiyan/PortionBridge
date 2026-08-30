import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "./Icon";

/**
 * Modal component for displaying content in an overlay
 * @param {string} title - Modal title
 * @param {Function} onClose - Callback when modal should close
 * @param {React.ReactNode} children - Modal content
 * @param {boolean} isOpen - Whether modal is open
 */
export function Modal({ title, onClose, children, isOpen = true }) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
  }, []);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    visible: { opacity: 1, scale: 1, y: 0 },
  };

  const transition = prefersReducedMotion ? { duration: 0 } : { duration: 0.2, ease: "easeOut" };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={transition}
          style={{ background: "rgba(20,12,28,0.55)" }}
          onClick={onClose}
        >
          <motion.div
            className="bg-surface rounded-2xl max-w-md w-full p-6 relative shadow-2xl border border-border"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={transition}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-hover text-text-secondary transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-dash-primary"
            >
              <Icon name="x" className="w-4 h-4" />
            </button>
            <h3 className="text-lg font-semibold text-text-primary mb-5 pr-8">{title}</h3>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
