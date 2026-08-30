/**
 * SkeletonNavbar - Loading skeleton for navbar component with shimmer effect
 */
export function SkeletonNavbar() {
  return (
    <header className="sticky top-0 z-20 bg-surface border-b border-border">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Left Section */}
        <div className="flex items-center gap-3 flex-1">
          <div className="w-8 h-8 rounded bg-surface-hover shimmer-skeleton" />
          <div className="hidden sm:flex items-center gap-2">
            <div className="h-5 w-20 bg-surface-hover rounded shimmer-skeleton" />
            <div className="h-5 w-4 bg-surface-hover rounded shimmer-skeleton" />
            <div className="h-5 w-16 bg-surface-hover rounded shimmer-skeleton" />
          </div>
        </div>

        {/* Center Section - Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 bg-surface-hover rounded shimmer-skeleton" />
            <div className="w-full h-10 bg-surface-hover rounded-lg shimmer-skeleton" />
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-surface-hover shimmer-skeleton" />
          <div className="w-10 h-10 rounded-lg bg-surface-hover shimmer-skeleton" />
          <div className="w-10 h-10 rounded-full bg-surface-hover shimmer-skeleton" />
        </div>
      </div>
    </header>
  );
}
