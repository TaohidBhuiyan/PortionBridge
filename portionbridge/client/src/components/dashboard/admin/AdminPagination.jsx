import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * AdminPagination — shared prev/next pagination footer, same visual
 * pattern as VolunteerHistory.jsx's inline pagination controls, factored
 * out since Phase 3 uses it in both AdminUsers and AdminDonations.
 */
export function AdminPagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 mt-4">
      <button
        onClick={() => onPageChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="p-2 rounded-lg border border-border text-text-secondary hover:bg-surface-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Previous page"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="text-sm text-text-secondary">Page {page} of {totalPages}</span>
      <button
        onClick={() => onPageChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="p-2 rounded-lg border border-border text-text-secondary hover:bg-surface-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        aria-label="Next page"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
