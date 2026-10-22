export default function Loading() {
  return (
    <div role="status" aria-label="Loading" className="animate-pulse space-y-6">
      <div className="h-8 w-64 rounded-lg bg-line/70" />
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-24 rounded-card bg-line/50" />
        ))}
      </div>
      <div className="h-64 rounded-card bg-line/40" />
    </div>
  );
}
