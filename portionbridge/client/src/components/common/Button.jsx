import { Loader2 } from 'lucide-react';

/**
 * PHASE 7 — Centralized Button primitive.
 *
 * Consolidates the button styles that were previously duplicated (and
 * inconsistently colored, some purple/violet) across auth pages and
 * dashboard forms into one token-driven component.
 *
 * variants: primary | secondary | outline | ghost | danger
 * sizes: sm | md | lg
 */
export function Button({
  as: Component = 'button',
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: IconEnd,
  className = '',
  children,
  ...props
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-150 ' +
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-dash-primary/40 focus-visible:ring-offset-2 ' +
    'disabled:cursor-not-allowed disabled:opacity-60';

  const sizes = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2.5',
    lg: 'text-sm px-5 py-3',
  };

  const variants = {
    primary:
      'bg-dash-primary text-white shadow-pb-subtle hover:bg-dash-primary-hover hover:shadow-pb-elevated active:scale-[0.98] active:shadow-pb-subtle',
    secondary:
      'bg-dash-primary-soft text-dash-primary hover:bg-dash-primary/15 active:scale-[0.98]',
    outline:
      'bg-transparent border border-border text-text-primary hover:bg-surface-hover active:scale-[0.98]',
    ghost:
      'bg-transparent text-text-secondary hover:bg-surface-hover hover:text-text-primary',
    danger:
      'bg-danger text-white shadow-pb-subtle hover:opacity-90 hover:shadow-pb-elevated active:scale-[0.98] active:shadow-pb-subtle',
  };

  return (
    <Component
      disabled={disabled || loading}
      className={`${base} ${sizes[size] || sizes.md} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {loading && <Loader2 size={size === 'sm' ? 13 : 15} className="animate-spin" />}
      <span>{children}</span>
      {!loading && IconEnd ? <IconEnd size={size === 'sm' ? 13 : 15} /> : null}
    </Component>
  );
}
