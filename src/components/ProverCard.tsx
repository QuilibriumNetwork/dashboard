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
    <div className="rounded-2xl border border-burgundy/10 bg-white/95 p-4 text-sm text-burgundy shadow-[0_20px_55px_-45px_rgba(64,0,27,0.5)] dark:border-white/10 dark:bg-[#211430]/95 dark:text-white">
      <div className="text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60">Address</div>
      <div className="mt-1 font-mono text-xs">
        <HoverableCopyText text={prover.address}>{displayAddress}</HoverableCopyText>
      </div>
      <div className="mt-2 text-xs text-burgundy/70 dark:text-white/70 flex flex-wrap gap-3">
        <span>Status: {prover.status}</span>
        <span>Seniority: {prover.seniorityLabel}</span>
      </div>
      <div className="mt-2 text-xs text-burgundy/70 dark:text-white/70">Storage: {prover.storageLabel}</div>
      {prover.delegate && (
        <div className="mt-2 text-xs">
          <span className="text-burgundy/60 dark:text-white/60">Delegate:</span>{" "}
          <HoverableCopyText text={prover.delegate}>{prover.delegate}</HoverableCopyText>
        </div>
      )}
      <div className="mt-3 text-xs">
        <div className="text-[0.65rem] uppercase tracking-[0.3em] text-burgundy/50 dark:text-white/50">Allocations</div>
        {prover.allocations.length ? (
          prover.allocations.map((alloc, idx) => (
            <div key={alloc.id} className="mt-2 border-l border-burgundy/20 dark:border-white/20 pl-3">
              <div className="font-semibold text-burgundy dark:text-white">#{idx + 1} {alloc.status}</div>
              <div className="text-burgundy/70 dark:text-white/70">
                Last active {alloc.lastActiveLabel}
              </div>
              {alloc.confirmation && (
                <div className="text-burgundy/70 dark:text-white/70 break-all">
                  Confirm filter: <HoverableCopyText text={alloc.confirmation}>{alloc.confirmation}</HoverableCopyText>
                </div>
              )}
              {alloc.rejection && (
                <div className="text-burgundy/70 dark:text-white/70 break-all">
                  Reject filter: <HoverableCopyText text={alloc.rejection}>{alloc.rejection}</HoverableCopyText>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-burgundy/60 dark:text-white/60">No allocations</div>
        )}
      </div>
    </div>
  );
}
