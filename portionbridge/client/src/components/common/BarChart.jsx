
/**
 * Simple CSS-based Bar Chart component
 * Displays category breakdown or other categorical data
 */
export function BarChart({ data, height = 200 }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-gray-500 dark:text-gray-400 text-sm">No data available</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.value), 1);

  return (
    <div className="flex items-end justify-around gap-2" style={{ height }}>
      {data.map((item, index) => {
        const heightPercent = (item.value / maxValue) * 100;
        return (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div
              className="w-full rounded-t-sm transition-all duration-300 hover:opacity-80"
              style={{
                height: `${heightPercent}%`,
                backgroundColor: item.color || 'rgb(147, 51, 234)',
                minHeight: '4px',
              }}
              title={`${item.label}: ${item.value}`}
            />
            <span className="text-xs text-gray-600 dark:text-gray-400 mt-2 truncate w-full text-center">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
