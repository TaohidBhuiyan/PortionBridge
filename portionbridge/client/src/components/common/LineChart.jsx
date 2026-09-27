
/**
 * Simple CSS-based Line Chart component
 * Displays monthly donation trend
 * @param {Array} data - Array of data points
 * @param {string} [dataKey='count'] - Which numeric field on each data point
 *   to plot. Defaults to 'count' for backward compatibility with callers
 *   (e.g. DonorAnalyticsPage) that pass rows already shaped as { count }.
 * @param {string} [color='rgb(2, 132, 199)'] - Stroke/fill color for the
 *   line, points, and area fill.
 */
export function LineChart({ data, dataKey = 'count', color = 'rgb(2, 132, 199)', height = 200 }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-text-muted text-sm">No data available</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => parseFloat(d[dataKey]) || 0), 1);
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (((parseFloat(d[dataKey]) || 0) / maxValue) * 100);
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
          fill={color}
          fillOpacity="0.12"
        />
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
        {/* Data points */}
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * 100;
          const y = 100 - (((parseFloat(d[dataKey]) || 0) / maxValue) * 100);
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="2"
              fill={color}
            />
          );
        })}
      </svg>
    </div>
  );
}
