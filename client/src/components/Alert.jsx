export function Alert({ type = "error", children }) {
  if (!children) {
    return null;
  }

  const tone =
    type === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
      : "border-rose-200 bg-rose-50 text-rose-900";

  return <div className={`rounded-md border px-4 py-3 text-sm ${tone}`}>{children}</div>;
}
