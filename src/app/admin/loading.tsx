export default function AdminLoading() {
  return (
    <div className="space-y-12 animate-pulse">
      {/* Header */}
      <div className="space-y-4">
        <div className="h-3 w-40 bg-white/5 rounded-full" />
        <div className="h-14 w-72 bg-white/5 rounded-2xl" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-40 bg-white/[0.02] border border-white/5 rounded-[2.5rem]" />
        ))}
      </div>

      {/* Content panels */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="h-[400px] bg-white/[0.02] border border-white/5 rounded-[3rem]" />
        <div className="h-[400px] bg-white/[0.02] border border-white/5 rounded-[3rem]" />
      </div>
    </div>
  );
}
