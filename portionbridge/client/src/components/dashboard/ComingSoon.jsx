import { Construction } from 'lucide-react';

/**
 * ComingSoon — shared placeholder panel for dashboard sections whose
 * routing/navigation foundation exists but whose real functionality
 * (data fetching, live sockets, etc.) is built in a later phase.
 *
 * Deliberately renders no fake/sample data — just an honest "not built
 * yet" state, matching EmptyState's visual language so it doesn't look
 * out of place next to real dashboard content.
 */
export function ComingSoon({
  icon = Construction,
  title = 'Coming soon',
  description = 'This section is on the roadmap and will be available in an upcoming update.',
}) {
  const Icon = icon;

  return (
    <div className="bg-surface rounded-lg border border-border/50 p-10 flex flex-col items-center justify-center text-center">
      <div className="w-14 h-14 rounded-full bg-dash-primary-soft flex items-center justify-center mb-3">
        <Icon size={24} className="text-dash-primary" />
      </div>
      <h2 className="text-lg font-semibold text-text-primary mb-1">{title}</h2>
      <p className="text-sm text-text-secondary max-w-sm">{description}</p>
    </div>
  );
}
