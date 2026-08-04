/**
 * SkeletonTable - Loading skeleton for table components
 */
export function SkeletonTable({ rows = 5, columns = 4 }) {
  return (
    <div className="bg-white dark:bg-[#120721] rounded-lg border border-gray-200 dark:border-purple-950/30 overflow-hidden">
      {/* Header */}
      <div className="flex border-b border-gray-200 dark:border-purple-950/30 bg-gray-50 dark:bg-purple-950/10">
        {Array.from({ length: columns }).map((_, index) => (
          <div
            key={index}
            className="flex-1 px-4 py-3 h-12 bg-gray-200 dark:bg-purple-950/30 animate-pulse"
          />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex border-b border-gray-100 dark:border-purple-950/20 last:border-b-0"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="flex-1 px-4 py-3 h-12 bg-gray-100 dark:bg-purple-950/20 animate-pulse"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
