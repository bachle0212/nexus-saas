export function SkeletonCard({ className = '' }) {
  return (
    <div className={`animate-pulse bg-white rounded-xl border border-slate-200 overflow-hidden ${className}`}>
      <div className="aspect-square bg-slate-200" />
      <div className="p-4 space-y-2">
        <div className="h-3 bg-slate-200 rounded w-1/3" />
        <div className="h-3 bg-slate-200 rounded w-full" />
        <div className="h-3 bg-slate-200 rounded w-2/3" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }) {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 items-center px-4 py-3 bg-white rounded-lg border border-slate-100">
          <div className="w-10 h-10 bg-slate-200 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-slate-200 rounded w-1/3" />
            <div className="h-3 bg-slate-200 rounded w-1/2" />
          </div>
          <div className="h-6 bg-slate-200 rounded w-16" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonStats() {
  return (
    <div className="animate-pulse grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="h-4 bg-slate-200 rounded w-2/3 mb-3" />
          <div className="h-8 bg-slate-200 rounded w-1/2" />
        </div>
      ))}
    </div>
  );
}
