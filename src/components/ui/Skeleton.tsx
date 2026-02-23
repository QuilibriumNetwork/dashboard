import { cn } from "@/components/helpers/classnames";

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded animate-pulse bg-burgundy/[0.07] dark:bg-white/[0.12]",
        className,
      )}
    />
  );
}

/** 3-column stat cards matching the Global Frame overview grid */
export function StatCardsSkeleton() {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-default bg-surface-raised p-6 space-y-3"
        >
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-28" />
        </div>
      ))}
    </div>
  );
}

/** Two side-by-side detail cards matching Requests Root / Parent Selector */
export function DetailCardsSkeleton() {
  return (
    <div className="grid gap-4 text-sm md:grid-cols-2">
      {[0, 1].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-default bg-white px-4 py-4 dark:bg-surface-raised space-y-2"
        >
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-6 w-full max-w-xs" />
        </div>
      ))}
    </div>
  );
}

/** Frame feed table skeleton — desktop table + mobile cards */
export function FrameTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {/* Mobile cards */}
      <div className="space-y-4 md:hidden">
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-default bg-white px-4 py-4 dark:bg-surface-raised space-y-3"
          >
            <Skeleton className="h-5 w-32" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex justify-between pt-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-28" />
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <div className="max-h-[520px] overflow-y-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-surface label-text">
              <tr>
                <th className="py-3 pr-6">Frame</th>
                <th className="py-3 pr-6">Requests</th>
                <th className="py-3 pr-6">Prover</th>
                <th className="py-3 pr-6">Selector</th>
                <th className="py-3 pr-6">Timestamp</th>
                <th className="py-3 pr-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {Array.from({ length: rows }, (_, i) => (
                <tr key={i}>
                  <td className="py-4 pr-6"><Skeleton className="h-4 w-20" /></td>
                  <td className="py-4 pr-6"><Skeleton className="h-4 w-10" /></td>
                  <td className="py-4 pr-6"><Skeleton className="h-4 w-32" /></td>
                  <td className="py-4 pr-6"><Skeleton className="h-4 w-32" /></td>
                  <td className="py-4 pr-6"><Skeleton className="h-4 w-28" /></td>
                  <td className="py-4 pr-6"><Skeleton className="h-4 w-24" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/** Peer directory skeleton — desktop table + mobile cards */
export function PeerDirectorySkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {/* Mobile cards */}
      <div className="space-y-4 md:hidden">
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-default bg-surface-raised p-4 space-y-3"
          >
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-20" />
            <div className="space-y-1 pt-2">
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        ))}
      </div>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 z-10 bg-surface label-text">
            <tr>
              <th className="py-3 pr-6">Peer</th>
              <th className="py-3 pr-6">Version</th>
              <th className="py-3 pr-6">Pubsub</th>
              <th className="py-3 pr-6">Stream</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-subtle">
            {Array.from({ length: rows }, (_, i) => (
              <tr key={i}>
                <td className="py-4 pr-6"><Skeleton className="h-4 w-40" /></td>
                <td className="py-4 pr-6"><Skeleton className="h-4 w-16" /></td>
                <td className="py-4 pr-6"><Skeleton className="h-4 w-36" /></td>
                <td className="py-4 pr-6"><Skeleton className="h-4 w-36" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/** Shard coverage table skeleton — desktop table + mobile cards */
export function ShardTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <>
      {/* Mobile cards */}
      <div className="space-y-4 md:hidden">
        {Array.from({ length: rows }, (_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-default bg-surface-raised p-4 space-y-3"
          >
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-full max-w-xs" />
            <div className="flex items-center gap-2 pt-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <div className="space-y-1 pt-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <div className="max-h-[420px] overflow-y-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-surface label-text">
              <tr>
                <th className="py-3 px-4">Filter</th>
                <th className="py-3 px-4">Active</th>
                <th className="py-3 px-4">Joining</th>
                <th className="py-3 px-4">Paused</th>
                <th className="py-3 px-4">Leaving</th>
                <th className="py-3 px-4">Rejected</th>
                <th className="py-3 px-4">Kicked</th>
                <th className="py-3 px-4">Other</th>
                <th className="py-3 px-4">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-subtle">
              {Array.from({ length: rows }, (_, i) => (
                <tr key={i}>
                  <td className="py-3 px-4"><Skeleton className="h-4 w-28" /></td>
                  <td className="py-3 px-4"><Skeleton className="h-4 w-10" /></td>
                  <td className="py-3 px-4"><Skeleton className="h-4 w-10" /></td>
                  <td className="py-3 px-4"><Skeleton className="h-4 w-10" /></td>
                  <td className="py-3 px-4"><Skeleton className="h-4 w-10" /></td>
                  <td className="py-3 px-4"><Skeleton className="h-4 w-10" /></td>
                  <td className="py-3 px-4"><Skeleton className="h-4 w-10" /></td>
                  <td className="py-3 px-4"><Skeleton className="h-4 w-10" /></td>
                  <td className="py-3 px-4"><Skeleton className="h-4 w-10" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

/** Consensus gossip message skeleton cards */
export function GossipSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }, (_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-default bg-white px-4 py-4 dark:bg-surface-raised space-y-3"
        >
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-full max-w-md" />
          <div className="space-y-1 pt-1">
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}
