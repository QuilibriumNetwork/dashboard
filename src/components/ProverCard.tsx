import { HoverableCopyText } from "@/components/HoverableCopyText";
import { ProverLink, ShardLink } from "@/components/HexLink";
import type { FormattedProver } from "@/lib/provers";

interface ProverCardProps {
  prover: FormattedProver;
}

export function ProverCard({ prover }: ProverCardProps) {
  return (
    <div className="rounded-2xl border border-default bg-surface-raised p-4 text-sm text-burgundy dark:text-white">
      <div className="label-text">Address</div>
      <div className="mt-1 font-mono text-sm sm:text-xs">
        {prover.address && prover.address !== "–" ? <ProverLink address={prover.address} /> : "–"}
      </div>
      <div className="mt-2 text-sm sm:text-xs text-secondary flex flex-wrap gap-3">
        <span>Status: {prover.status}</span>
        <span>Seniority: {prover.seniorityLabel}</span>
      </div>
      <div className="mt-2 text-sm sm:text-xs text-secondary">Storage: {prover.storageLabel}</div>
      {prover.delegate && (
        <div className="mt-2 text-sm sm:text-xs">
          <span className="text-muted">Delegate:</span>{" "}
          <HoverableCopyText text={prover.delegate}>{prover.delegate}</HoverableCopyText>
        </div>
      )}
      <div className="mt-3 text-sm sm:text-xs">
        <div className="text-sm sm:text-xs font-medium text-muted">Allocations</div>
        {prover.allocations.length ? (
          prover.allocations.map((alloc, idx) => (
            <div key={alloc.id} className="mt-2 border-l border-default pl-3">
              <div className="font-semibold text-primary">#{idx + 1} {alloc.status}</div>
              <div className="text-secondary">
                Last active {alloc.lastActiveLabel}
              </div>
              {alloc.confirmation && (
                <div className="text-secondary break-all">
                  Confirm filter: <ShardLink filter={alloc.confirmation} />
                </div>
              )}
              {alloc.rejection && (
                <div className="text-secondary break-all">
                  Reject filter: <ShardLink filter={alloc.rejection} />
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-muted">No allocations</div>
        )}
      </div>
    </div>
  );
}
