/**
 * SkeletonSidebar - Loading skeleton for sidebar component with shimmer effect
 */
export function SkeletonSidebar({ collapsed = false }) {
  return (
    <aside
      className={`hidden lg:flex flex-col fixed left-0 top-0 h-full bg-surface border-r border-border ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-surface-hover shimmer-skeleton" />
            <div className="h-6 w-24 bg-surface-hover rounded shimmer-skeleton" />
          </div>
        )}
        <div className="w-8 h-8 rounded bg-surface-hover shimmer-skeleton" />
      </div>

      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-2">
        {Array.from({ length: 10 }).map((_, index) => (
          <div
            key={index}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <div className="w-5 h-5 bg-surface-hover rounded shimmer-skeleton shrink-0" />
            {!collapsed && (
              <div className="flex-1 h-4 bg-surface-hover rounded shimmer-skeleton" />
            )}
          </div>
        ))}
      </nav>

      {/* User Info */}
      {!collapsed && (
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-surface-hover shimmer-skeleton shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-20 bg-surface-hover rounded shimmer-skeleton" />
              <div className="h-3 w-16 bg-surface-hover rounded shimmer-skeleton" />
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
