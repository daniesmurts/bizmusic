export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header skeleton */}
      <div className="space-y-3">
        <div className="h-3 w-32 bg-white/5 rounded-full" />
        <div className="h-10 w-64 bg-white/5 rounded-2xl" />
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-white/[0.02] border border-white/5 rounded-[2rem]" />
        ))}
      </div>

      {/* Content rows */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-white/[0.02] border border-white/5 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
