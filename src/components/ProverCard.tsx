import { HoverableCopyText } from "@/components/HoverableCopyText";
import type { FormattedProver } from "@/lib/provers";

interface ProverCardProps {
  prover: FormattedProver;
}

function formatDisplayAddress(address: string) {
  if (!address) return "–";
  const hasPrefix = address.startsWith("0x");
  const prefix = hasPrefix ? "0x" : "";
  const value = hasPrefix ? address.slice(2) : address;
  if (value.length <= 16) {
    return address;
  }
  return `${prefix}${value.slice(0, 8)}…${value.slice(-6)}`;
}

export function ProverCard({ prover }: ProverCardProps) {
  const displayAddress = formatDisplayAddress(prover.address);
  return (
    <div className="rounded-2xl border border-default bg-surface-raised p-4 text-sm text-burgundy dark:text-white">
      <div className="label-text">Address</div>
      <div className="mt-1 font-mono text-sm sm:text-xs">
        <HoverableCopyText text={prover.address}>{displayAddress}</HoverableCopyText>
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
        <div className="sub-label-text">Allocations</div>
        {prover.allocations.length ? (
          prover.allocations.map((alloc, idx) => (
            <div key={alloc.id} className="mt-2 border-l border-default pl-3">
              <div className="font-semibold text-primary">#{idx + 1} {alloc.status}</div>
              <div className="text-secondary">
                Last active {alloc.lastActiveLabel}
              </div>
              {alloc.confirmation && (
                <div className="text-secondary break-all">
                  Confirm filter: <HoverableCopyText text={alloc.confirmation}>{alloc.confirmation}</HoverableCopyText>
                </div>
              )}
              {alloc.rejection && (
                <div className="text-secondary break-all">
                  Reject filter: <HoverableCopyText text={alloc.rejection}>{alloc.rejection}</HoverableCopyText>
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
