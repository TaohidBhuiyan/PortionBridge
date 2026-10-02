import { useState } from 'react';

/**
 * Enhanced Bar Chart component with rounded pill bars, value readouts, and hover tooltips
 * @param {Array} data - Array of items with { label, value, color }
 * @param {number} [height=200] - Container height
 */
export function BarChart({ data = [], height = 200 }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-2xl bg-page/50 border border-border/50" style={{ height }}>
        <p className="text-text-muted text-xs font-medium">No data available</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(d => Number(d.value) || 0), 1);

  return (
    <div className="relative flex flex-col justify-end w-full" style={{ height }}>
      {/* Background grid lines */}
      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none pb-8">
        {[1, 0.5, 0].map((_, i) => (
          <div key={i} className="w-full border-b border-border/40 border-dashed" />
        ))}
      </div>

      <div className="relative z-10 flex items-end justify-around gap-2 h-full pb-8 pt-6">
        {data.map((item, index) => {
          const val = Number(item.value) || 0;
          const heightPercent = (val / maxValue) * 100;
          const isHovered = hoveredIdx === index;
          const barColor = item.color || 'var(--pb-primary)';

          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer"
              onMouseEnter={() => setHoveredIdx(index)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Value pill on hover */}
              <div
                className={`mb-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-surface border border-border text-text-primary shadow-xs transition-opacity duration-200 ${
                  isHovered ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {val}
              </div>

              {/* Bar */}
              <div className="w-full max-w-[40px] bg-surface-hover/60 rounded-t-xl overflow-hidden p-0.5 flex flex-col justify-end h-full max-h-[140px]">
                <div
                  className="w-full rounded-t-lg transition-all duration-500 ease-out group-hover:brightness-110"
                  style={{
                    height: `${Math.max(heightPercent, 4)}%`,
                    backgroundColor: barColor,
                  }}
                />
              </div>

              {/* Label */}
              <span
                className={`text-[11px] mt-2 truncate w-full text-center font-medium transition-colors ${
                  isHovered ? 'text-text-primary font-bold' : 'text-text-muted'
                }`}
              >
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default BarChart;
