"use client";

export function WorkloadBar({ pct, compact = false }: { pct: number; compact?: boolean }) {
  const color =
    pct >= 80 ? "bg-red-500" :
    pct >= 60 ? "bg-amber-500" :
    pct >= 40 ? "bg-blue-500" :
    "bg-green-500";

  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {!compact && (
        <span className="text-xs font-semibold w-8 text-right text-muted-foreground shrink-0">{pct}%</span>
      )}
      {compact && (
        <span className="text-xs font-semibold text-muted-foreground shrink-0 w-8 text-right">{pct}%</span>
      )}
    </div>
  );
}
