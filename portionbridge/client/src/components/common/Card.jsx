/**
 * PHASE 7 — Centralized Card primitive.
 *
 * A restrained, premium surface: subtle border, controlled radius, and a
 * card-level shadow that only strengthens on hover when `interactive` is
 * set. Use this instead of one-off `bg-surface border border-border
 * rounded-xl` blocks scattered across pages.
 */
export function Card({ as: Component = 'div', interactive = false, padding = 'md', className = '', children, ...props }) {
  const paddings = {
    none: '',
    sm: 'p-3',
    md: 'p-4 sm:p-5',
    lg: 'p-6 sm:p-7',
  };

  return (
    <Component
      className={`bg-surface border border-border rounded-xl shadow-pb-card ${
        interactive ? 'transition-[box-shadow,transform] duration-200 hover:shadow-pb-elevated hover:-translate-y-0.5' : ''
      } ${paddings[padding] || paddings.md} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex items-start justify-between gap-3 mb-4 ${className}`}>
      <div className="min-w-0">
        <h3 className="text-sm font-semibold text-text-primary truncate">{title}</h3>
        {subtitle ? <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
