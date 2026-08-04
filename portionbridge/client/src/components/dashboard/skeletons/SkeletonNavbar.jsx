/**
 * SkeletonNavbar - Loading skeleton for navbar component
 */
export function SkeletonNavbar() {
  return (
    <header className="sticky top-0 z-20 bg-white dark:bg-[#120721] border-b border-gray-200 dark:border-purple-950/30">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left Section */}
        <div className="flex items-center gap-3 flex-1">
          <div className="w-8 h-8 rounded bg-gray-200 dark:bg-purple-950/30 animate-pulse" />
          <div className="hidden sm:flex items-center gap-2">
            <div className="h-5 w-20 bg-gray-200 dark:bg-purple-950/30 rounded animate-pulse" />
            <div className="h-5 w-4 bg-gray-200 dark:bg-purple-950/30 rounded animate-pulse" />
            <div className="h-5 w-16 bg-gray-200 dark:bg-purple-950/30 rounded animate-pulse" />
          </div>
        </div>

        {/* Center Section - Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-200 dark:bg-purple-950/30 rounded animate-pulse" />
            <div className="w-full h-10 bg-gray-100 dark:bg-purple-950/10 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-purple-950/30 animate-pulse" />
          <div className="w-10 h-10 rounded-lg bg-gray-200 dark:bg-purple-950/30 animate-pulse" />
          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-purple-950/30 animate-pulse" />
        </div>
      </div>
    </header>
  );
}
