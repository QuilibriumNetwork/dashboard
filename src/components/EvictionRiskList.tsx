import type { EvictionRiskEntry } from "@/lib/api";
import { toneBadgeClasses, type Tone } from "@/lib/production";
import { ProverLink, ShardLink } from "@/components/HexLink";

interface RiskState {
  label: string;
  shortLabel: string;
  tone: Tone;
  rowClass: string;
}

function riskToneForRatio(ratio: number): Tone {
  if (ratio >= 1) return "risk";
  if (ratio >= 0.5) return "warn";
  return "safe";
}

const rowToneClasses: Record<Tone, string> = {
  risk: "bg-danger-subtle",
  warn: "bg-warning-subtle",
  safe: "",
  default: "",
};

/**
 * An allocation's standing. A stalled shard's allocations are exempt from
 * eviction however long they are inactive, so their ratio is not a risk.
 */
function riskState(entry: EvictionRiskEntry): RiskState {
  if (entry.eviction_pending) {
    return { label: "Eviction pending", shortLabel: "Pending", tone: "risk", rowClass: rowToneClasses.risk };
  }
  if (!entry.shard_progressing) {
    return { label: "Exempt: shard stalled", shortLabel: "Shard stalled", tone: "default", rowClass: "" };
  }
  const tone = riskToneForRatio(entry.risk_ratio);
  const percent = `${Math.round(entry.risk_ratio * 100)}%`;
  return { label: `${percent} risk`, shortLabel: percent, tone, rowClass: rowToneClasses[tone] };
}

function EvictionRiskCard({
  entry,
  showProver,
  showFilter,
}: {
  entry: EvictionRiskEntry;
  showProver: boolean;
  showFilter: boolean;
}) {
  const state = riskState(entry);
  return (
    <div className="rounded-2xl border border-default bg-surface-raised p-4 text-sm text-burgundy dark:text-white">
      <div className="flex items-center justify-between gap-2">
        <div className="label-text">{showProver ? "Prover" : "Shard filter"}</div>
        <span className={`text-xs font-semibold uppercase tracking-label rounded-full px-3 py-1 ${toneBadgeClasses[state.tone]}`}>
          {state.label}
        </span>
      </div>
      <div className="mt-1 text-sm sm:text-xs">
        {showProver ? <ProverLink address={entry.address} /> : <ShardLink filter={entry.filter} />}
      </div>
      {showProver && showFilter && (
        <>
          <div className="mt-2 text-sm sm:text-xs text-muted">Shard filter</div>
          <div className="text-sm sm:text-xs">
            <ShardLink filter={entry.filter} />
          </div>
        </>
      )}
      <div className="mt-3 grid grid-cols-2 gap-y-1 text-sm sm:text-xs text-secondary">
        <span>Runway</span>
        <span className="text-right font-semibold text-primary">{entry.frames_until_eviction.toLocaleString()} frames</span>
        <span>Inactive for</span>
        <span className="text-right font-semibold text-primary">{entry.effective_inactive.toLocaleString()} frames</span>
        {entry.shard_halt_duration > 0 && (
          <>
            <span>Halt credit</span>
            <span className="text-right font-semibold text-primary">{entry.shard_halt_duration.toLocaleString()} frames</span>
          </>
        )}
        <span>Last active</span>
        <span className="text-right font-semibold text-primary">{entry.last_active_frame_number.toLocaleString()}</span>
        <span>Seniority</span>
        <span className="text-right font-semibold text-primary">{entry.seniority.toLocaleString()}</span>
      </div>
    </div>
  );
}

/** Eviction-risk entries as cards on mobile and a table from `md` up. */
export function EvictionRiskList({
  entries,
  showProver = true,
  showFilter = true,
}: {
  entries: EvictionRiskEntry[];
  showProver?: boolean;
  showFilter?: boolean;
}) {
  return (
    <>
      <div className="space-y-4 md:hidden">
        {entries.map((entry) => (
          <EvictionRiskCard
            key={`${entry.address}-${entry.filter}`}
            entry={entry}
            showProver={showProver}
            showFilter={showFilter}
          />
        ))}
      </div>
      <div className="hidden md:block overflow-x-auto">
        <div className="max-h-[420px] overflow-y-auto">
          <table className="min-w-full divide-y divide-subtle text-left text-sm text-primary">
            <thead className="sticky top-0 z-10 bg-surface label-text">
              <tr>
                {showProver && <th className="py-3 px-4">Prover</th>}
                {showFilter && <th className="py-3 px-4">Shard filter</th>}
                <th className="py-3 px-4">Runway</th>
                <th className="py-3 px-4">Inactive</th>
                <th className="py-3 px-4">Last active</th>
                <th className="py-3 px-4">Seniority</th>
                <th className="py-3 px-4">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {entries.map((entry) => {
                const state = riskState(entry);
                return (
                  <tr key={`${entry.address}-${entry.filter}`} className={state.rowClass}>
                    {showProver && (
                      <td className="py-3 px-4 text-sm sm:text-xs align-top">
                        <ProverLink address={entry.address} />
                      </td>
                    )}
                    {showFilter && (
                      <td className="py-3 px-4 text-sm sm:text-xs align-top">
                        <ShardLink filter={entry.filter} />
                      </td>
                    )}
                    <td className="py-3 px-4 text-sm sm:text-xs align-top font-semibold">
                      {entry.frames_until_eviction.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm sm:text-xs align-top">
                      {entry.effective_inactive.toLocaleString()}
                      {entry.shard_halt_duration > 0 && (
                        <span className="ml-1 text-muted">(−{entry.shard_halt_duration.toLocaleString()} halt)</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm sm:text-xs align-top">
                      {entry.last_active_frame_number.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-sm sm:text-xs align-top">{entry.seniority.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm sm:text-xs align-top font-semibold whitespace-nowrap">
                      {state.tone === "default" ? (
                        <span className="text-muted" title="Allocations on a stalled shard are exempt from eviction">
                          {state.shortLabel}
                        </span>
                      ) : (
                        state.shortLabel
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
