/**
 * SkeletonCard - Loading skeleton for card components
 */
export function SkeletonCard({ count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white dark:bg-[#120721] rounded-lg border border-gray-200 dark:border-purple-950/30 p-4 animate-pulse"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-purple-950/30 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 dark:bg-purple-950/30 rounded w-3/4" />
              <div className="h-3 bg-gray-200 dark:bg-purple-950/30 rounded w-1/2" />
              <div className="h-3 bg-gray-200 dark:bg-purple-950/30 rounded w-1/3" />
            </div>
          </div>
        </div>
      ))}
    </>
  );
}
