import React, { useEffect } from "react";
import { X } from "lucide-react";

/**
 * Modal component for displaying content in an overlay
 * Redesigned for compact, professional appearance
 * @param {string} title - Modal title
 * @param {Function} onClose - Callback when modal should close
 * @param {React.ReactNode} children - Modal content
 */
export function Modal({ title, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-lg max-w-md w-full p-5 md:p-6 relative shadow-lg animate-modal-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <X size={16} />
        </button>
        <h3 className="font-sans text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4 pr-8">{title}</h3>
        {children}
      </div>
    </div>
  );
}
