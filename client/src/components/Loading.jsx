export function Loading({ label = "Loading" }) {
  return (
    <div className="flex min-h-[240px] items-center justify-center text-sm font-medium text-zinc-600">
      {label}...
    </div>
  );
}
