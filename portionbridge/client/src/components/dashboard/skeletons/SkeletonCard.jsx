/**
 * SkeletonCard - Loading skeleton for card components with shimmer effect
 */
export function SkeletonCard({ count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-surface rounded-lg border border-border p-4 shimmer-skeleton"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-surface-hover shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-surface-hover rounded w-3/4" />
              <div className="h-3 bg-surface-hover rounded w-1/2" />
              <div className="h-3 bg-surface-hover rounded w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
