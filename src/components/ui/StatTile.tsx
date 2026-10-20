import type { Tone } from "@/lib/production";

export function StatTile({
  label,
  value,
  tone = "default",
  hint,
}: {
  label: string;
  value: React.ReactNode;
  tone?: Tone;
  hint?: React.ReactNode;
}) {
  const toneClass = {
    default: "text-primary",
    safe: "text-green dark:text-light-green",
    warn: "text-warning",
    risk: "text-danger",
  }[tone];
  return (
    <div className="rounded-2xl border border-default bg-surface-raised p-4">
      <div className="label-text">{label}</div>
      <div className={`mt-1 text-2xl font-semibold ${toneClass}`}>{value}</div>
      {hint && <div className="mt-1 text-sm sm:text-xs text-muted">{hint}</div>}
    </div>
  );
}
