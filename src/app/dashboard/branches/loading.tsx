export default function BranchesLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-10 w-48 bg-white/5 rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-40 bg-white/[0.02] border border-white/5 rounded-[2rem]" />
        ))}
      </div>
    </div>
  );
}
