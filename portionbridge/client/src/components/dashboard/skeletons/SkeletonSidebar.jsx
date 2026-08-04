/**
 * SkeletonSidebar - Loading skeleton for sidebar component
 */
export function SkeletonSidebar({ collapsed = false }) {
  return (
    <aside
      className={`hidden lg:flex flex-col fixed left-0 top-0 h-full bg-white dark:bg-[#120721] border-r border-gray-200 dark:border-purple-950/30 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-purple-950/30">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-purple-950/30 animate-pulse" />
            <div className="h-6 w-24 bg-gray-200 dark:bg-purple-950/30 rounded animate-pulse" />
          </div>
        )}
        <div className="w-8 h-8 rounded bg-gray-200 dark:bg-purple-950/30 animate-pulse" />
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
            <div className="w-5 h-5 bg-gray-200 dark:bg-purple-950/30 rounded animate-pulse shrink-0" />
            {!collapsed && (
              <div className="flex-1 h-4 bg-gray-200 dark:bg-purple-950/30 rounded animate-pulse" />
            )}
          </div>
        ))}
      </nav>

      {/* User Info */}
      {!collapsed && (
        <div className="p-4 border-t border-gray-200 dark:border-purple-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-purple-950/30 animate-pulse shrink-0" />
            <div className="flex-1 space-y-1">
              <div className="h-4 w-20 bg-gray-200 dark:bg-purple-950/30 rounded animate-pulse" />
              <div className="h-3 w-16 bg-gray-200 dark:bg-purple-950/30 rounded animate-pulse" />
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
