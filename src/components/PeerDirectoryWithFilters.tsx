import { type PeerRow } from "@/lib/peers";
import { type PeerRecord } from "@/lib/api";
import { PeerDirectoryFiltersAndExport } from "./PeerDirectoryFiltersAndExport";
import { PeerDirectory } from "./PeerDirectory";
import { useState } from "react";

interface PeerDirectoryWithFiltersProps {
  peerRows: PeerRow[];
  peerRecords: PeerRecord[];
}

export function PeerDirectoryWithFilters({
  peerRows,
  peerRecords,
}: PeerDirectoryWithFiltersProps) {
  const [filteredPeers, setFilteredPeers] = useState<PeerRow[]>(peerRows);

  return (
    <div className="space-y-6">
      <PeerDirectoryFiltersAndExport
        peerRows={peerRows}
        peerRecords={peerRecords}
        onFilteredPeersChange={setFilteredPeers}
      />

      <PeerDirectory peers={filteredPeers} />
    </div>
  );
}

