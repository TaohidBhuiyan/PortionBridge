
/**
 * Simple CSS-based Line Chart component
 * Displays monthly donation trend
 */
export function LineChart({ data, height = 200 }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <p className="text-text-muted text-sm">No data available</p>
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
          fill="rgba(2, 132, 199, 0.12)"
          className="dark:fill-sky-400/15"
        />
        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke="rgb(2, 132, 199)"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          className="dark:stroke-sky-400"
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
              fill="rgb(2, 132, 199)"
              className="dark:fill-sky-400"
            />
          );
        })}
      </svg>
    </div>
  );
}
