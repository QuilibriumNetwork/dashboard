import { useState } from "react";
import type { AppShardsStats, ProductionClass, ProductionWindow, ShardProduction } from "@/lib/api";
import { PRODUCTION_CLASSES } from "@/lib/api";
import { formatFrameSpan, formatQuil } from "@/lib/format";
import { productionClassMeta, toneBadgeClasses } from "@/lib/production";
import { StatTile } from "@/components/ui/StatTile";
import { Pagination } from "@/components/ui/Pagination";
import { Tooltip } from "@/components/ui/Tooltip";
import { ShardLink } from "@/components/HexLink";

const CARDS_PER_PAGE = 20;

function count(value: number | null | undefined) {
  return value === null || value === undefined ? "–" : value.toLocaleString();
}

export function ProductionClassBadge({ productionClass }: { productionClass: ProductionClass }) {
  const meta = productionClassMeta[productionClass];
  return (
    <Tooltip content={meta.description} className="max-w-xs">
      <span
        className={`inline-flex whitespace-nowrap text-xs font-semibold uppercase tracking-label rounded-full px-3 py-1 ${toneBadgeClasses[meta.tone]}`}
      >
        {meta.label}
      </span>
    </Tooltip>
  );
}

/** "Last 240 frames (≈ 40 min)", and whether the index is behind the head. */
export function ProductionWindowNote({ window }: { window: ProductionWindow }) {
  const span = formatFrameSpan(window.window_frames, window.median_frame_interval_ms);
  const lag =
    window.indexed_through !== null && window.indexed_through < window.head_frame
      ? window.head_frame - window.indexed_through
      : 0;
  return (
    <span>
      Last {window.window_frames.toLocaleString()} global frames{span ? ` (${span})` : ""}
      {!window.window_complete && " · window still indexing"}
      {window.index_waiting_frame !== null && ` · waiting on frame ${window.index_waiting_frame.toLocaleString()}`}
      {lag > 0 && ` · index ${lag.toLocaleString()} frames behind`}
    </span>
  );
}

/** Network-wide production tiles from /stats `app_shards`. */
export function ProductionSummaryTiles({ stats }: { stats: AppShardsStats }) {
  const { classes, live_shards } = stats;
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      <StatTile
        label="Producing shards"
        value={`${classes.producing.toLocaleString()} / ${live_shards.toLocaleString()}`}
        tone={classes.producing > 0 ? "safe" : "warn"}
      />
      <StatTile
        label="Staffed, not producing"
        value={classes.staffed_not_producing.toLocaleString()}
        tone={classes.staffed_not_producing > 0 ? "warn" : "default"}
      />
      <StatTile
        label="Below quorum"
        value={classes.below_quorum.toLocaleString()}
        tone={classes.below_quorum > 0 ? "risk" : "default"}
      />
      <StatTile label="App frames applied" value={stats.applied_in_window.toLocaleString()} />
    </div>
  );
}

function ShardProductionCard({ shard }: { shard: ShardProduction }) {
  return (
    <div className="rounded-2xl border border-default bg-surface-raised p-4 text-sm text-burgundy dark:text-white">
      <div className="flex items-center justify-between gap-2">
        <div className="label-text">Shard filter</div>
        <ProductionClassBadge productionClass={shard.class} />
      </div>
      <div className="mt-1 text-sm sm:text-xs">
        <ShardLink filter={shard.filter} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-y-1 text-sm sm:text-xs text-secondary">
        <span>Applied in window</span>
        <span className="text-right font-semibold text-primary">{shard.applied_in_window.toLocaleString()}</span>
        <span>Last applied app frame</span>
        <span className="text-right font-semibold text-primary">{count(shard.last_applied_app_frame)}</span>
        <span>Signers (last)</span>
        <span className="text-right font-semibold text-primary">
          {shard.signers_last === null ? "–" : `${shard.signers_last} / ${count(shard.committee_last)}`}
        </span>
        <span>Active members</span>
        <span className="text-right font-semibold text-primary">{shard.active_members.toLocaleString()}</span>
        <span>Session</span>
        <span className="text-right font-semibold text-primary">
          {shard.session_generation === null ? "–" : `gen ${shard.session_generation} · ${count(shard.session_members)} members`}
        </span>
        {shard.coverage_halt && (
          <>
            <span>Coverage</span>
            <span className="text-right font-semibold text-warning">Halted</span>
          </>
        )}
      </div>
    </div>
  );
}

/** Live shards' production: cards on mobile (paged), a table from `md` up. */
export function ShardProductionTable({ shards }: { shards: ShardProduction[] }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(shards.length / CARDS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);

  return (
    <>
      <div className="space-y-4 md:hidden">
        {shards.slice((currentPage - 1) * CARDS_PER_PAGE, currentPage * CARDS_PER_PAGE).map((shard) => (
          <ShardProductionCard key={shard.filter} shard={shard} />
        ))}
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
      </div>
      <div className="hidden md:block overflow-x-auto">
        <div className="max-h-[480px] overflow-y-auto">
          <table className="min-w-full divide-y divide-subtle text-left text-sm text-primary">
            <thead className="sticky top-0 z-10 bg-surface label-text">
              <tr>
                <th className="py-3 px-4">Filter</th>
                <th className="py-3 px-4">Class</th>
                <th className="py-3 px-4">Applied</th>
                <th className="py-3 px-4">Last app frame</th>
                <th className="py-3 px-4">Signers</th>
                <th className="py-3 px-4">Active</th>
                <th className="py-3 px-4">Session</th>
                <th className="py-3 px-4">Drained</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {shards.map((shard) => (
                <tr key={shard.filter} className={shard.coverage_halt ? "bg-warning-subtle" : ""}>
                  <td className="py-3 px-4 text-sm sm:text-xs align-top">
                    <ShardLink filter={shard.filter} />
                  </td>
                  <td className="py-3 px-4 align-top">
                    <ProductionClassBadge productionClass={shard.class} />
                  </td>
                  <td className="py-3 px-4 text-sm sm:text-xs align-top font-semibold">
                    {shard.applied_in_window.toLocaleString()}
                    {shard.not_applied_in_window > 0 && (
                      <span className="ml-1 font-normal text-danger">({shard.not_applied_in_window} not applied)</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-sm sm:text-xs align-top">{count(shard.last_applied_app_frame)}</td>
                  <td className="py-3 px-4 text-sm sm:text-xs align-top whitespace-nowrap">
                    {shard.signers_last === null ? "–" : `${shard.signers_last} / ${count(shard.committee_last)}`}
                  </td>
                  <td className="py-3 px-4 text-sm sm:text-xs align-top">{shard.active_members.toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm sm:text-xs align-top whitespace-nowrap">
                    {shard.session_generation === null
                      ? "–"
                      : `gen ${shard.session_generation} · ${count(shard.session_members)}`}
                  </td>
                  <td className="py-3 px-4 text-sm sm:text-xs align-top">{shard.drained_in_window.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/** Class filter chips with counts; `null` selects every class. */
export function ProductionClassFilter({
  counts,
  total,
  selected,
  onSelect,
}: {
  counts: Record<ProductionClass, number>;
  total: number;
  selected: ProductionClass | null;
  onSelect: (value: ProductionClass | null) => void;
}) {
  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-label transition-colors ${
      active ? "border-strong bg-active-highlight text-primary" : "border-default text-secondary hover:text-primary"
    }`;
  return (
    <div className="flex flex-wrap gap-2">
      <button className={chip(selected === null)} onClick={() => onSelect(null)}>
        All ({total.toLocaleString()})
      </button>
      {PRODUCTION_CLASSES.map((productionClass) => (
        <button
          key={productionClass}
          className={chip(selected === productionClass)}
          onClick={() => onSelect(productionClass)}
        >
          {productionClassMeta[productionClass].label} ({(counts[productionClass] ?? 0).toLocaleString()})
        </button>
      ))}
    </div>
  );
}

/** One shard's production detail, for the shard page. */
export function ShardProductionPanel({ shard, window }: { shard: ShardProduction; window: ProductionWindow }) {
  const tiles: Array<{ label: string; value: React.ReactNode }> = [
    { label: "Applied app frames", value: shard.applied_in_window.toLocaleString() },
    { label: "Headers included", value: shard.inclusions_in_window.toLocaleString() },
    { label: "Not applied", value: shard.not_applied_in_window.toLocaleString() },
    { label: "Unknown outcome", value: shard.unknown_outcome_in_window.toLocaleString() },
    { label: "Drained (handoff)", value: shard.drained_in_window.toLocaleString() },
    { label: "Fees relayed", value: `${formatQuil(shard.fees_relayed_in_window_quil)} QUIL` },
    { label: "Last applied app frame", value: count(shard.last_applied_app_frame) },
    { label: "Applied in global frame", value: count(shard.last_applied_global_frame) },
    { label: "Last applied rank", value: count(shard.last_applied_rank) },
    {
      label: "Signers (last)",
      value: shard.signers_last === null ? "–" : `${shard.signers_last} / ${count(shard.committee_last)}`,
    },
    { label: "Committed app head", value: count(shard.committed_app_head) },
    {
      label: "Session",
      value: shard.session_generation === null ? "–" : `gen ${shard.session_generation} · ${count(shard.session_members)} members`,
    },
    { label: "Active members", value: shard.active_members.toLocaleString() },
    { label: "Coverage", value: shard.coverage_halt ? "Halted" : "Normal" },
  ];
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <ProductionClassBadge productionClass={shard.class} />
        <span className="text-sm sm:text-xs text-secondary">
          <ProductionWindowNote window={window} />
        </span>
      </div>
      <p className="text-sm text-secondary">{productionClassMeta[shard.class].description}</p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-xl border border-default bg-surface-raised px-3 py-2">
            <div className="label-text">{tile.label}</div>
            <div className="mt-0.5 text-sm font-semibold text-primary">{tile.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
