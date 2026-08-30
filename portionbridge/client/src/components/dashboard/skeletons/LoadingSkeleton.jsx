/**
 * LoadingSkeleton - Comprehensive loading skeleton for donation details page with shimmer effect
 */
export function LoadingSkeleton() {
  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Skeleton */}
      <div className="mb-8">
        <div className="h-8 w-32 bg-surface-hover rounded-lg shimmer-skeleton mb-4" />
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div className="space-y-2">
            <div className="h-10 w-64 bg-surface-hover rounded-lg shimmer-skeleton" />
            <div className="h-4 w-48 bg-surface-hover rounded-lg shimmer-skeleton" />
          </div>
          <div className="flex items-center gap-2">
            <div className="h-10 w-24 bg-surface-hover rounded-xl shimmer-skeleton" />
            <div className="h-10 w-24 bg-surface-hover rounded-xl shimmer-skeleton" />
            <div className="h-10 w-24 bg-surface-hover rounded-xl shimmer-skeleton" />
          </div>
        </div>
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Donation Overview Skeleton */}
          <div className="bg-surface rounded-2xl border border-border p-6 shimmer-skeleton">
            <div className="h-6 w-48 bg-surface-hover rounded-lg mb-4" />
            <div className="space-y-4">
              <div className="h-4 w-32 bg-surface-hover rounded-lg" />
              <div className="h-20 w-full bg-surface-hover rounded-lg" />
              <div className="h-4 w-24 bg-surface-hover rounded-lg" />
            </div>
          </div>

          {/* Pickup Details Skeleton */}
          <div className="bg-surface rounded-2xl border border-border p-6 shimmer-skeleton">
            <div className="h-6 w-48 bg-surface-hover rounded-lg mb-4" />
            <div className="space-y-3">
              <div className="h-4 w-full bg-surface-hover rounded-lg" />
              <div className="h-4 w-3/4 bg-surface-hover rounded-lg" />
              <div className="h-4 w-1/2 bg-surface-hover rounded-lg" />
            </div>
          </div>

          {/* Status Timeline Skeleton */}
          <div className="bg-surface rounded-2xl border border-border p-6 shimmer-skeleton">
            <div className="h-6 w-48 bg-surface-hover rounded-lg mb-4" />
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-surface-hover" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-surface-hover rounded-lg" />
                    <div className="h-3 w-24 bg-surface-hover rounded-lg" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Volunteer Card Skeleton */}
          <div className="bg-surface rounded-2xl border border-border p-6 shimmer-skeleton">
            <div className="h-6 w-48 bg-surface-hover rounded-lg mb-4" />
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-surface-hover" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 bg-surface-hover rounded-lg" />
                <div className="h-3 w-24 bg-surface-hover rounded-lg" />
              </div>
            </div>
          </div>

          {/* Tracking Panel Skeleton */}
          <div className="bg-surface rounded-2xl border border-border p-6 shimmer-skeleton">
            <div className="h-6 w-48 bg-surface-hover rounded-lg mb-4" />
            <div className="h-48 w-full bg-surface-hover rounded-lg" />
          </div>

          {/* Chat Window Skeleton */}
          <div className="bg-surface rounded-2xl border border-border p-6 shimmer-skeleton">
            <div className="h-6 w-48 bg-surface-hover rounded-lg mb-4" />
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 w-3/4 bg-surface-hover rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
