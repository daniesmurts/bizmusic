export default function PlayerLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Player controls */}
      <div className="h-48 bg-white/[0.02] border border-white/5 rounded-[2.5rem]" />
      {/* Track list */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-16 bg-white/[0.02] border border-white/5 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}
