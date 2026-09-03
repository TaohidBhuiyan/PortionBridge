/**
 * SkeletonTable - Loading skeleton for table components
 */
export function SkeletonTable({ rows = 5, columns = 4 }) {
  return (
    <div className="bg-surface rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <div className="flex border-b border-border bg-page">
        {Array.from({ length: columns }).map((_, index) => (
          <div
            key={index}
            className="flex-1 px-4 py-3 h-12 bg-surface-hover animate-pulse"
          />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="flex border-b border-border last:border-b-0"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div
              key={colIndex}
              className="flex-1 px-4 py-3 h-12 bg-surface-hover animate-pulse"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
