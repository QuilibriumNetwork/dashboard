import { ProverRecord } from "./api";

export interface FormattedAllocation {
  id: string;
  status: string;
  lastActiveLabel: string;
  confirmation?: string;
  rejection?: string;
}

export interface FormattedProver {
  id: string;
  address: string;
  publicKey?: string;
  status: string;
  seniorityValue: number | null;
  seniorityLabel: string;
  storageBytes: number | null;
  storageLabel: string;
  delegate?: string;
  allocations: FormattedAllocation[];
}

export function prefixHex(value?: string | null) {
  if (!value) return "";
  return value.startsWith("0x") ? value : `0x${value}`;
}

export function formatByteSize(bytes?: number | null) {
  if (bytes === undefined || bytes === null || bytes <= 0) {
    return "–";
  }
  const units = ["B", "KB", "MB", "GB", "TB", "PB"];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  const formatted = size >= 10 ? size.toFixed(1) : size.toFixed(2);
  return `${formatted} ${units[unitIndex]}`;
}

export function formatProvers(records: ProverRecord[]): FormattedProver[] {
  return records.map((prover, idx) => {
    const address = prover.address ? prefixHex(prover.address) : "–";
    const seniorityValue = typeof prover.seniority === "number" ? prover.seniority : null;
    const storageBytes = typeof prover.available_storage === "number" ? prover.available_storage : null;
    const allocationList = prover.allocations ?? [];
    const primaryAllocation = allocationList[0];
    const status = primaryAllocation?.status ?? prover.status ?? "unknown";

    return {
      id: `${address}-${idx}`,
      address,
      publicKey: prover.public_key ? prefixHex(prover.public_key) : undefined,
      status,
      seniorityValue,
      seniorityLabel: seniorityValue !== null ? seniorityValue.toLocaleString() : "–",
      storageBytes,
      storageLabel: formatByteSize(storageBytes),
      delegate: prover.delegate_address ? prefixHex(prover.delegate_address) : undefined,
      allocations: allocationList.map((allocation, allocationIdx) => ({
        id: `${address}-alloc-${allocationIdx}`,
        status: allocation.status ?? "unknown",
        lastActiveLabel: allocation.last_active_frame_number
          ? `#${allocation.last_active_frame_number.toLocaleString()}`
          : "–",
        confirmation: allocation.confirmation_filter ? prefixHex(allocation.confirmation_filter) : undefined,
        rejection: allocation.rejection_filter ? prefixHex(allocation.rejection_filter) : undefined,
      })),
    };
  });
}
