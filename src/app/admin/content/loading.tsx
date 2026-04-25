export default function AdminContentLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Toolbar */}
      <div className="flex gap-4">
        <div className="h-10 w-64 bg-white/5 rounded-2xl" />
        <div className="h-10 w-32 bg-white/5 rounded-2xl" />
      </div>
      {/* Track rows */}
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-20 bg-white/[0.02] border border-white/5 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
