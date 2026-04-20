export function ProgressBar({ value }) {
  const width = Math.max(0, Math.min(Number(value) || 0, 100));

  return (
    <div className="h-3 overflow-hidden rounded-md bg-zinc-200" aria-label={`${width}% funded`}>
      <div className="h-full rounded-md bg-emerald-500" style={{ width: `${width}%` }} />
    </div>
  );
}
