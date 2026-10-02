import { useState, useRef, useId } from 'react';

/** Monotone cubic smoothing */
function smoothPath(pts) {
  const n = pts.length;
  if (n === 0) return '';
  if (n === 1) return `M${pts[0].x},${pts[0].y}`;

  const dx = [];
  const m = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1].x - pts[i].x;
    m[i] = (pts[i + 1].y - pts[i].y) / dx[i];
  }
  const t = new Array(n);
  t[0] = m[0];
  t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) {
    t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  }
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
    } else {
      const a = t[i] / m[i];
      const b = t[i + 1] / m[i];
      const s = a * a + b * b;
      if (s > 9) {
        const tau = 3 / Math.sqrt(s);
        t[i] = tau * a * m[i];
        t[i + 1] = tau * b * m[i];
      }
    }
  }

  let d = `M${pts[0].x},${pts[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i];
    d += ` C${pts[i].x + h / 3},${pts[i].y + (t[i] * h) / 3} ${pts[i + 1].x - h / 3},${pts[i + 1].y - (t[i + 1] * h) / 3} ${pts[i + 1].x},${pts[i + 1].y}`;
  }
  return d;
}

/**
 * Enhanced Line/Area Chart component with smooth curves, gradients, and hover tooltips
 * @param {Array} data - Array of data points
 * @param {string} [dataKey='count'] - Field to plot
 * @param {string} [color='var(--pb-primary)'] - Stroke/fill color
 * @param {number} [height=200] - Container height
 */
export function LineChart({ data = [], dataKey = 'count', color = 'var(--pb-primary)', height = 200 }) {
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const [activeIdx, setActiveIdx] = useState(null);
  const containerRef = useRef(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-2xl bg-page/50 border border-border/50" style={{ height }}>
        <p className="text-text-muted text-xs font-medium">No activity data available</p>
      </div>
    );
  }

  const values = data.map(d => parseFloat(d[dataKey]) || 0);
  const maxValue = Math.max(...values, 1);
  const padY = 15;
  const padX = 15;
  const viewW = 300;
  const viewH = 150;
  const innerW = viewW - padX * 2;
  const innerH = viewH - padY * 2;

  const pts = data.map((d, i) => {
    const x = data.length === 1 ? viewW / 2 : padX + (i / (data.length - 1)) * innerW;
    const val = parseFloat(d[dataKey]) || 0;
    const y = padY + innerH - (val / maxValue) * innerH;
    return { x, y, val, label: d.month || d.label || `Point ${i + 1}` };
  });

  const pathD = smoothPath(pts);
  const areaD = pts.length > 1 ? `${pathD} L${pts[pts.length - 1].x},${viewH - padY} L${pts[0].x},${viewH - padY} Z` : '';

  const activePoint = activeIdx !== null ? pts[activeIdx] : null;

  const handlePointer = (e) => {
    if (!containerRef.current || pts.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const px = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const idx = Math.round((px / rect.width) * (pts.length - 1));
    setActiveIdx(Math.max(0, Math.min(pts.length - 1, idx)));
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full select-none"
      style={{ height }}
      onMouseMove={handlePointer}
      onMouseLeave={() => setActiveIdx(null)}
      onTouchStart={handlePointer}
      onTouchMove={handlePointer}
      onTouchEnd={() => setActiveIdx(null)}
    >
      <svg
        viewBox={`0 0 ${viewW} ${viewH}`}
        preserveAspectRatio="none"
        className="w-full h-full overflow-visible"
      >
        <defs>
          <linearGradient id={`line-grad-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Subtle grid lines */}
        {[0, 0.5, 1].map((pct, i) => {
          const y = padY + innerH * pct;
          return (
            <line
              key={i}
              x1={padX}
              x2={viewW - padX}
              y1={y}
              y2={y}
              stroke="var(--pb-border)"
              strokeDasharray={pct === 1 ? undefined : '3 4'}
              opacity="0.6"
              strokeWidth="0.8"
            />
          );
        })}

        {/* Area fill */}
        {pts.length > 1 && (
          <path
            d={areaD}
            fill={`url(#line-grad-${uid})`}
          />
        )}

        {/* Smooth line */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={activeIdx === i ? 5 : 3}
            fill={color}
            stroke="var(--pb-surface)"
            strokeWidth="1.5"
            className="transition-all duration-150"
          />
        ))}

        {/* Active guide line */}
        {activePoint && (
          <line
            x1={activePoint.x}
            x2={activePoint.x}
            y1={padY}
            y2={viewH - padY}
            stroke="var(--pb-text-muted)"
            strokeDasharray="2 3"
            opacity="0.6"
            strokeWidth="1"
          />
        )}
      </svg>

      {/* Hover Floating Tooltip */}
      {activePoint && (
        <div
          className="pointer-events-none absolute -top-2 z-10 -translate-x-1/2 -translate-y-full rounded-xl border border-border/80 bg-surface/95 px-3 py-1.5 text-xs shadow-pb-card backdrop-blur"
          style={{
            left: `${(activePoint.x / viewW) * 100}%`,
          }}
        >
          <p className="font-semibold text-[11px] text-text-secondary">{activePoint.label}</p>
          <p className="font-bold text-text-primary text-xs flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            {activePoint.val} {dataKey === 'count' ? 'donations' : dataKey}
          </p>
        </div>
      )}
    </div>
  );
}

export default LineChart;
