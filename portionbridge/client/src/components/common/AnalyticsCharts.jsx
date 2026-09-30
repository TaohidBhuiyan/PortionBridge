import { useEffect, useId, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { fullMonth, shortMonth } from './chartUtils';

/**
 * AnalyticsCharts — premium, dependency-free SVG charts used by the admin
 * analytics pages.
 *
 * - Pixel-accurate (measured with ResizeObserver) instead of a stretched
 *   viewBox, so lines, dots and text never distort.
 * - Colours are passed as CSS values (e.g. 'var(--pb-primary)'), so every
 *   chart follows the light/dark theme automatically.
 * - Hover / touch tooltips, smooth monotone curves, gradient fills, animated
 *   entrance (skipped when the user prefers reduced motion).
 */

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const num = (v) => Number(v) || 0;
const noSpaces = (s) => String(s).replace(/[^a-zA-Z0-9_-]/g, '');

/** Measures an element's width (falls back to `fallback` before layout / on the server). */
function useMeasuredWidth(fallback = 560) {
  const ref = useRef(null);
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const update = () => {
      const w = el.clientWidth;
      if (w > 0) setWidth(w);
    };
    update();
    if (typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return [ref, width];
}

/** Integer-friendly axis: returns { max, ticks }. */
function niceScale(maxValue, target = 4) {
  const raw = Math.max(maxValue, 1);
  const rough = raw / target;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const f = rough / pow;
  const step = Math.max(1, (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pow);
  const max = Math.ceil(raw / step) * step;
  const ticks = [];
  for (let v = 0; v <= max + 1e-9; v += step) ticks.push(v);
  return { max, ticks };
}

/** Monotone cubic path (no overshoot below zero). */
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

/** Floating tooltip shared by the area and bar charts. */
function ChartTooltip({ x, width, title, rows }) {
  const left = clamp(x, 84, Math.max(width - 84, 84));
  return (
    <div
      className="pointer-events-none absolute top-0 z-10 min-w-[128px] -translate-x-1/2 rounded-xl border border-border bg-elevated/95 px-3 py-2 text-xs shadow-pb-elevated backdrop-blur"
      style={{ left }}
    >
      <p className="mb-1.5 font-semibold text-text-primary">{title}</p>
      <div className="space-y-1">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-text-secondary">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: row.color }} />
              {row.label}
            </span>
            <span className="font-semibold tabular-nums text-text-primary">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyOverlay({ text }) {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <span className="rounded-full border border-border/70 bg-surface/90 px-3 py-1 text-xs font-medium text-text-muted shadow-pb-subtle backdrop-blur">
        {text}
      </span>
    </div>
  );
}

const MARGIN = { top: 14, right: 14, bottom: 28, left: 34 };

/**
 * Multi-series smooth area chart.
 * @param {Array}  data    rows, each with an `xKey` ('YYYY-MM') and the series keys
 * @param {Array}  series  [{ key, label, color }]
 */
export function AreaChart({
  data = [],
  series = [],
  xKey = 'month',
  height = 240,
  emptyText = 'No activity in this period',
  ariaLabel = 'Trend chart',
}) {
  const reduce = useReducedMotion();
  const uid = noSpaces(useId());
  const [wrapRef, width] = useMeasuredWidth();
  const svgRef = useRef(null);
  const [active, setActive] = useState(null);

  const n = data.length;
  const innerW = Math.max(width - MARGIN.left - MARGIN.right, 10);
  const innerH = Math.max(height - MARGIN.top - MARGIN.bottom, 10);
  const baseline = MARGIN.top + innerH;

  const maxValue = Math.max(0, ...data.flatMap((d) => series.map((s) => num(d[s.key]))));
  const { max, ticks } = niceScale(maxValue);
  const isEmpty = maxValue === 0;

  const xAt = (i) => (n <= 1 ? MARGIN.left + innerW / 2 : MARGIN.left + (i * innerW) / (n - 1));
  const yAt = (v) => MARGIN.top + innerH - (num(v) / max) * innerH;

  const handlePointer = (e) => {
    if (!svgRef.current || n === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const px = clientX - rect.left;
    const idx = n === 1 ? 0 : Math.round(((px - MARGIN.left) / innerW) * (n - 1));
    setActive(clamp(idx, 0, n - 1));
  };

  const labelStep = n > 8 ? 2 : 1;

  return (
    <div ref={wrapRef} className="relative w-full select-none" style={{ height }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="block overflow-visible"
        role="img"
        aria-label={ariaLabel}
      >
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`${uid}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: s.color }} stopOpacity="0.32" />
              <stop offset="100%" style={{ stopColor: s.color }} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>

        {/* Grid + y axis */}
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={MARGIN.left}
              x2={MARGIN.left + innerW}
              y1={yAt(tick)}
              y2={yAt(tick)}
              style={{ stroke: 'var(--pb-border)' }}
              strokeDasharray={tick === 0 ? undefined : '3 5'}
              opacity={tick === 0 ? 0.9 : 0.7}
            />
            <text
              x={MARGIN.left - 10}
              y={yAt(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="11"
              style={{ fill: 'var(--pb-text-muted)' }}
            >
              {tick}
            </text>
          </g>
        ))}

        {/* x labels */}
        {data.map((d, i) =>
          i % labelStep === 0 ? (
            <text
              key={d[xKey]}
              x={xAt(i)}
              y={baseline + 18}
              textAnchor="middle"
              fontSize="11"
              fontWeight={active === i ? 700 : 500}
              style={{ fill: active === i ? 'var(--pb-text-primary)' : 'var(--pb-text-muted)' }}
            >
              {shortMonth(d[xKey])}
            </text>
          ) : null
        )}

        {/* Hover guide */}
        {active !== null && n > 0 && (
          <line
            x1={xAt(active)}
            x2={xAt(active)}
            y1={MARGIN.top}
            y2={baseline}
            style={{ stroke: 'var(--pb-text-muted)' }}
            strokeDasharray="4 4"
            opacity="0.5"
          />
        )}

        {/* Series */}
        {series.map((s, si) => {
          const pts = data.map((d, i) => ({ x: xAt(i), y: yAt(d[s.key]) }));
          const line = smoothPath(pts);
          const area = n > 1 ? `${line} L${pts[n - 1].x},${baseline} L${pts[0].x},${baseline} Z` : '';
          return (
            <g key={s.key}>
              {n > 1 && (
                <motion.path
                  d={area}
                  fill={`url(#${uid}-${s.key})`}
                  initial={reduce ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.8, delay: 0.2 + si * 0.1 }}
                />
              )}
              {n > 1 && (
                <motion.path
                  d={line}
                  fill="none"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ stroke: s.color }}
                  initial={reduce ? false : { pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.9, delay: si * 0.1, ease: 'easeOut' }}
                />
              )}
              {pts.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={active === i ? 5.5 : 3}
                  strokeWidth="2"
                  style={{ fill: s.color, stroke: 'var(--pb-surface)', transition: 'r 120ms ease' }}
                />
              ))}
            </g>
          );
        })}

        {/* Pointer capture */}
        <rect
          x={MARGIN.left - 10}
          y={MARGIN.top}
          width={innerW + 20}
          height={innerH + MARGIN.bottom}
          fill="transparent"
          onMouseMove={handlePointer}
          onMouseLeave={() => setActive(null)}
          onTouchStart={handlePointer}
          onTouchMove={handlePointer}
          onTouchEnd={() => setActive(null)}
        />
      </svg>

      {active !== null && data[active] && (
        <ChartTooltip
          x={xAt(active)}
          width={width}
          title={fullMonth(data[active][xKey])}
          rows={series.map((s) => ({ label: s.label, color: s.color, value: num(data[active][s.key]) }))}
        />
      )}
      {isEmpty && <EmptyOverlay text={emptyText} />}
    </div>
  );
}

/** Grouped bar chart (one bar per series for every x value). */
export function GroupedBarChart({
  data = [],
  series = [],
  xKey = 'month',
  height = 240,
  emptyText = 'No activity in this period',
  ariaLabel = 'Bar chart',
}) {
  const reduce = useReducedMotion();
  const uid = noSpaces(useId());
  const [wrapRef, width] = useMeasuredWidth();
  const [active, setActive] = useState(null);

  const n = data.length;
  const innerW = Math.max(width - MARGIN.left - MARGIN.right, 10);
  const innerH = Math.max(height - MARGIN.top - MARGIN.bottom, 10);
  const baseline = MARGIN.top + innerH;

  const maxValue = Math.max(0, ...data.flatMap((d) => series.map((s) => num(d[s.key]))));
  const { max, ticks } = niceScale(maxValue);
  const isEmpty = maxValue === 0;

  const band = n > 0 ? innerW / n : innerW;
  const barW = clamp((band * 0.62) / Math.max(series.length, 1) - 2, 6, 30);
  const gap = 4;
  const groupW = series.length * barW + (series.length - 1) * gap;
  const yAt = (v) => MARGIN.top + innerH - (num(v) / max) * innerH;
  const bandCenter = (i) => MARGIN.left + band * i + band / 2;
  const radius = Math.min(6, barW / 2);

  return (
    <div ref={wrapRef} className="relative w-full select-none" style={{ height }}>
      <svg width={width} height={height} className="block overflow-visible" role="img" aria-label={ariaLabel}>
        <defs>
          <clipPath id={`${uid}-clip`}>
            <rect x={MARGIN.left - 4} y={0} width={innerW + 8} height={baseline} />
          </clipPath>
          {series.map((s) => (
            <linearGradient key={s.key} id={`${uid}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style={{ stopColor: s.color }} stopOpacity="1" />
              <stop offset="100%" style={{ stopColor: s.color }} stopOpacity="0.55" />
            </linearGradient>
          ))}
        </defs>

        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={MARGIN.left}
              x2={MARGIN.left + innerW}
              y1={yAt(tick)}
              y2={yAt(tick)}
              style={{ stroke: 'var(--pb-border)' }}
              strokeDasharray={tick === 0 ? undefined : '3 5'}
              opacity={tick === 0 ? 0.9 : 0.7}
            />
            <text
              x={MARGIN.left - 10}
              y={yAt(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize="11"
              style={{ fill: 'var(--pb-text-muted)' }}
            >
              {tick}
            </text>
          </g>
        ))}

        {/* Hover band */}
        {active !== null && (
          <rect
            x={MARGIN.left + band * active + 4}
            y={MARGIN.top}
            width={Math.max(band - 8, 0)}
            height={innerH}
            rx="10"
            style={{ fill: 'var(--pb-surface-hover)' }}
            opacity="0.9"
          />
        )}

        <g clipPath={`url(#${uid}-clip)`}>
          {data.map((d, i) =>
            series.map((s, si) => {
              const v = num(d[s.key]);
              const h = Math.max((v / max) * innerH, v > 0 ? 3 : 2);
              const x = bandCenter(i) - groupW / 2 + si * (barW + gap);
              const y = baseline - h;
              return (
                <motion.rect
                  key={`${d[xKey]}-${s.key}`}
                  x={x}
                  width={barW}
                  rx={radius}
                  fill={`url(#${uid}-${s.key})`}
                  opacity={v > 0 ? 1 : 0.28}
                  initial={reduce ? false : { y: baseline, height: 0 }}
                  animate={{ y, height: h + radius }}
                  transition={{ duration: 0.6, delay: i * 0.05 + si * 0.04, ease: 'easeOut' }}
                />
              );
            })
          )}
        </g>

        {data.map((d, i) => (
          <text
            key={d[xKey]}
            x={bandCenter(i)}
            y={baseline + 18}
            textAnchor="middle"
            fontSize="11"
            fontWeight={active === i ? 700 : 500}
            style={{ fill: active === i ? 'var(--pb-text-primary)' : 'var(--pb-text-muted)' }}
          >
            {shortMonth(d[xKey])}
          </text>
        ))}

        {/* One transparent hit-area per band */}
        {data.map((d, i) => (
          <rect
            key={`hit-${d[xKey]}`}
            x={MARGIN.left + band * i}
            y={MARGIN.top}
            width={band}
            height={innerH + MARGIN.bottom}
            fill="transparent"
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            onTouchStart={() => setActive(i)}
          />
        ))}
      </svg>

      {active !== null && data[active] && (
        <ChartTooltip
          x={bandCenter(active)}
          width={width}
          title={fullMonth(data[active][xKey])}
          rows={series.map((s) => ({ label: s.label, color: s.color, value: num(data[active][s.key]) }))}
        />
      )}
      {isEmpty && <EmptyOverlay text={emptyText} />}
    </div>
  );
}

/** Donut chart with an interactive centre readout. */
export function DonutChart({
  data = [],
  size = 190,
  thickness = 20,
  centerLabel = 'Total',
  ariaLabel = 'Distribution chart',
}) {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(null);

  const total = data.reduce((sum, d) => sum + num(d.value), 0);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const visible = data.filter((d) => num(d.value) > 0);
  const gap = visible.length > 1 ? 4 : 0;

  const arcs = data.map((d, i) => {
    const frac = total > 0 ? num(d.value) / total : 0;
    const len = Math.max(frac * c - (frac > 0 ? gap : 0), 0);
    // Start of this arc = sum of the fractions before it (no mutation during render).
    const before = data.slice(0, i).reduce((t, x) => t + (total > 0 ? num(x.value) / total : 0), 0);
    return { ...d, i, frac, len, offset: -before * c };
  });

  const current = active !== null ? arcs[active] : null;
  const centerValue = current ? current.value : total;
  const centerText = current ? current.label : centerLabel;
  const centerSub = current ? `${Math.round(current.frac * 100)}%` : null;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} role="img" aria-label={ariaLabel} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={thickness}
          style={{ stroke: 'var(--pb-border)' }}
          opacity="0.55"
        />
        {arcs.map((a) =>
          a.len > 0 ? (
            <motion.circle
              key={a.label}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              strokeWidth={active === a.i ? thickness + 4 : thickness}
              strokeDashoffset={a.offset}
              style={{ stroke: a.color, cursor: 'pointer', transition: 'stroke-width 150ms ease' }}
              initial={reduce ? false : { strokeDasharray: `0 ${c}` }}
              animate={{ strokeDasharray: `${a.len} ${c - a.len}` }}
              transition={{ duration: 0.8, delay: a.i * 0.12, ease: 'easeOut' }}
              onMouseEnter={() => setActive(a.i)}
              onMouseLeave={() => setActive(null)}
              onTouchStart={() => setActive(a.i)}
            />
          ) : null
        )}
      </svg>

      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-bold leading-none tabular-nums text-text-primary">{centerValue}</span>
        <span className="mt-1.5 text-xs font-medium text-text-secondary">{centerText}</span>
        {centerSub && <span className="text-[11px] font-semibold text-text-muted">{centerSub}</span>}
      </div>
    </div>
  );
}

/** Circular progress gauge (0-100). */
export function RadialGauge({ value = 0, size = 168, thickness = 14, label = 'complete' }) {
  const reduce = useReducedMotion();
  const uid = noSpaces(useId());
  const pct = clamp(num(value), 0, 100);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const len = (pct / 100) * c;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} role="img" aria-label={`${pct}% ${label}`} className="-rotate-90">
        <defs>
          <linearGradient id={`${uid}-g`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: 'var(--pb-primary)' }} />
            <stop offset="100%" style={{ stopColor: 'var(--pb-info)' }} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={thickness}
          style={{ stroke: 'var(--pb-border)' }}
          opacity="0.55"
        />
        {pct > 0 && (
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={thickness}
            strokeLinecap="round"
            stroke={`url(#${uid}-g)`}
            initial={reduce ? false : { strokeDasharray: `0 ${c}` }}
            animate={{ strokeDasharray: `${len} ${c - len}` }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
          />
        )}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl font-bold leading-none tabular-nums text-text-primary">
          {pct}
          <span className="text-xl font-semibold text-text-secondary">%</span>
        </span>
        <span className="mt-1.5 text-xs font-medium text-text-secondary">{label}</span>
      </div>
    </div>
  );
}

/** Tiny trend line for KPI tiles. */
export function Sparkline({ values = [], color = 'var(--pb-primary)', width = 92, height = 34 }) {
  const uid = noSpaces(useId());
  const nums = values.map(num);
  if (nums.length < 2) return <div style={{ width, height }} />;

  const max = Math.max(...nums, 1);
  const pad = 3;
  const pts = nums.map((v, i) => ({
    x: pad + (i * (width - pad * 2)) / (nums.length - 1),
    y: height - pad - (v / max) * (height - pad * 2),
  }));
  const line = smoothPath(pts);
  const area = `${line} L${pts[pts.length - 1].x},${height} L${pts[0].x},${height} Z`;
  const last = pts[pts.length - 1];

  return (
    <svg width={width} height={height} aria-hidden="true" className="block overflow-visible">
      <defs>
        <linearGradient id={`${uid}-s`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" style={{ stopColor: color }} stopOpacity="0.28" />
          <stop offset="100%" style={{ stopColor: color }} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${uid}-s)`} />
      <path d={line} fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: color }} />
      <circle cx={last.x} cy={last.y} r="3" strokeWidth="1.5" style={{ fill: color, stroke: 'var(--pb-surface)' }} />
    </svg>
  );
}
