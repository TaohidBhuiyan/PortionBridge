import { useEffect } from "react";
import { Icon } from "./Icon";

/**
 * Modal component for displaying content in an overlay
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
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(20,12,28,0.55)", animation: "fadeIn 0.2s ease" }}
      onClick={onClose}
    >
      <div
        className="bg-surface rounded-2xl max-w-md w-full p-6 relative shadow-2xl border border-border"
        style={{ animation: "modalIn 0.2s ease" }}
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
      </div>
    </div>
  );
}
