
/**
 * Simple CSS-based Pie Chart component
 * Displays category breakdown or percentage data
 */
export function PieChart({ data, size = 200 }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: size, height: size }}>
        <p className="text-gray-500 dark:text-gray-400 text-sm">No data</p>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = 0;

  const segments = data.map((item, index) => {
    const percentage = (item.value / total) * 100;
    const angle = (percentage / 100) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle += angle;

    // Calculate SVG path for pie slice
    const x1 = 50 + 40 * Math.cos((Math.PI / 180) * startAngle);
    const y1 = 50 + 40 * Math.sin((Math.PI / 180) * startAngle);
    const x2 = 50 + 40 * Math.cos((Math.PI / 180) * endAngle);
    const y2 = 50 + 40 * Math.sin((Math.PI / 180) * endAngle);

    const largeArcFlag = angle > 180 ? 1 : 0;

    const pathData = percentage === 100
      ? `M 50 50 m -40 0 a 40 40 0 1 0 80 0 a 40 40 0 1 0 -80 0`
      : `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

    return {
      path: pathData,
      color: item.color || `hsl(${index * 60}, 70%, 50%)`,
      label: item.label,
      value: item.value,
      percentage: percentage.toFixed(1),
    };
  });

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 100 100"
        style={{ width: size, height: size }}
        className="dark:drop-shadow-lg"
      >
        {segments.map((segment, index) => (
          <path
            key={index}
            d={segment.path}
            fill={segment.color}
            stroke="white"
            strokeWidth="0.5"
            className="hover:opacity-80 transition-opacity cursor-pointer"
          >
            <title>{segment.label}: {segment.value} ({segment.percentage}%)</title>
          </path>
        ))}
      </svg>
      <div className="mt-4 flex flex-wrap justify-center gap-3">
        {segments.map((segment, index) => (
          <div key={index} className="flex items-center gap-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: segment.color }}
            />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {segment.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
