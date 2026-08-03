import React, { useEffect } from "react";
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
        className="bg-white rounded-3xl max-w-md w-full p-6 md:p-8 relative shadow-2xl"
        style={{ animation: "modalIn 0.25s ease" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 text-black/45 transition-colors focus-visible:outline focus-visible:outline-2"
        >
          <Icon name="x" className="w-4 h-4" />
        </button>
        <h3 className="font-serif text-2xl mb-5 pr-8">{title}</h3>
        {children}
      </div>
    </div>
  );
}
