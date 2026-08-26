
/**
 * Simple CSS-based Line Chart component
 * Displays monthly donation trend
 */
export function LineChart({ data, height = 200 }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-gray-500 dark:text-gray-400 text-sm">No data available</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => d.count), 1);
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.count / maxValue) * 100);
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,100 ${points} 100,100`;

  return (
    <div className="relative" style={{ height }}>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="w-full h-full"
      >
        {/* Area fill */}
        <polygon
          points={areaPoints}
          fill="rgba(147, 51, 234, 0.1)"
          className="dark:fill-purple-900/20"
        />
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke="rgb(147, 51, 234)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          className="dark:stroke-purple-400"
        />
        {/* Data points */}
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * 100;
          const y = 100 - ((d.count / maxValue) * 100);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="2"
              fill="rgb(147, 51, 234)"
              className="dark:fill-purple-400"
            />
          );
        })}
      </svg>
    </div>
  );
}
