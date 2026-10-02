import { useState } from 'react';

/**
 * Enhanced Pie / Donut Chart component with interactive segments, tooltips, and legends
 */
export function PieChart({ data = [], size = 200, showLegend = true, innerRadiusRatio = 0.55 }) {
  const [activeIdx, setActiveIdx] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-2xl bg-page/50 border border-border/50" style={{ width: size, height: size }}>
        <p className="text-text-muted text-xs font-medium">No data</p>
      </div>
    );
  }

  const total = data.reduce((sum, item) => sum + (Number(item.value) || 0), 0);

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl bg-page/50 border border-border/50 p-4" style={{ width: size, height: size }}>
        <p className="text-text-muted text-xs font-medium">No recorded entries</p>
      </div>
    );
  }

  const startAngles = data.reduce((acc, item) => {
    const prevTotal = acc.length > 0 ? acc[acc.length - 1] : 0;
    const angle = ((Number(item.value) || 0) / total) * 360;
    acc.push(prevTotal + angle);
    return acc;
  }, []);

  const segments = data.map((item, index) => {
    const val = Number(item.value) || 0;
    const percentage = ((val / total) * 100);
    const angle = (percentage / 100) * 360;
    const startAngle = index === 0 ? 0 : startAngles[index - 1];
    const endAngle = startAngle + angle;

    const rOuter = 42;
    const rInner = rOuter * innerRadiusRatio;

    // Outer arc coords
    const x1 = 50 + rOuter * Math.cos((Math.PI / 180) * (startAngle - 90));
    const y1 = 50 + rOuter * Math.sin((Math.PI / 180) * (startAngle - 90));
    const x2 = 50 + rOuter * Math.cos((Math.PI / 180) * (endAngle - 90));
    const y2 = 50 + rOuter * Math.sin((Math.PI / 180) * (endAngle - 90));

    // Inner arc coords
    const x3 = 50 + rInner * Math.cos((Math.PI / 180) * (endAngle - 90));
    const y3 = 50 + rInner * Math.sin((Math.PI / 180) * (endAngle - 90));
    const x4 = 50 + rInner * Math.cos((Math.PI / 180) * (startAngle - 90));
    const y4 = 50 + rInner * Math.sin((Math.PI / 180) * (startAngle - 90));

    const largeArcFlag = angle > 180 ? 1 : 0;

    let pathData = '';
    if (percentage >= 99.9) {
      // Full circle donut
      pathData = `M 50 ${50 - rOuter} A ${rOuter} ${rOuter} 0 1 0 50 ${50 + rOuter} A ${rOuter} ${rOuter} 0 1 0 50 ${50 - rOuter} M 50 ${50 - rInner} A ${rInner} ${rInner} 0 1 1 50 ${50 + rInner} A ${rInner} ${rInner} 0 1 1 50 ${50 - rInner} Z`;
    } else {
      pathData = `M ${x1} ${y1} A ${rOuter} ${rOuter} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${x3} ${y3} A ${rInner} ${rInner} 0 ${largeArcFlag} 0 ${x4} ${y4} Z`;
    }

    return {
      path: pathData,
      color: item.color || `hsl(${index * 60}, 70%, 50%)`,
      label: item.label,
      value: val,
      percentage: percentage.toFixed(1),
    };
  });

  const activeSegment = activeIdx !== null ? segments[activeIdx] : null;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full overflow-visible"
        >
          {segments.map((segment, index) => (
            <path
              key={index}
              d={segment.path}
              fill={segment.color}
              stroke="var(--pb-surface)"
              strokeWidth="1.5"
              className="transition-all duration-200 cursor-pointer"
              style={{
                transform: activeIdx === index ? 'scale(1.04)' : 'scale(1)',
                transformOrigin: '50px 50px',
                opacity: activeIdx === null || activeIdx === index ? 1 : 0.6,
              }}
              onMouseEnter={() => setActiveIdx(index)}
              onMouseLeave={() => setActiveIdx(null)}
              onTouchStart={() => setActiveIdx(index)}
            />
          ))}
        </svg>

        {/* Center label */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center p-2">
          <span className="text-xl sm:text-2xl font-black tabular-nums text-text-primary leading-none">
            {activeSegment ? activeSegment.value : total}
          </span>
          <span className="mt-1 text-[11px] font-semibold text-text-secondary truncate max-w-[90px]">
            {activeSegment ? activeSegment.label : 'Total'}
          </span>
          {activeSegment && (
            <span className="text-[10px] font-bold text-text-muted mt-0.5">
              {activeSegment.percentage}%
            </span>
          )}
        </div>
      </div>

      {showLegend && (
        <div className="mt-4 flex flex-wrap justify-center gap-2.5 max-w-xs">
          {segments.map((segment, index) => (
            <button
              key={index}
              onMouseEnter={() => setActiveIdx(index)}
              onMouseLeave={() => setActiveIdx(null)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs transition-all border cursor-pointer ${
                activeIdx === index
                  ? 'bg-surface-hover border-border shadow-xs'
                  : 'bg-page/60 border-border/50 text-text-secondary'
              }`}
            >
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: segment.color }}
              />
              <span className="font-semibold text-text-primary">
                {segment.label}
              </span>
              <span className="text-text-muted font-medium ml-1">
                ({segment.percentage}%)
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default PieChart;
