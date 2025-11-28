import { useState, useMemo, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { type PeerRow } from "@/lib/peers";
import { type PeerRecord } from "@/lib/api";
import {
  getProtocolsFromAddresses,
  compareVersions,
  matchesSearch,
} from "@/lib/peers";
import { PeerDirectoryFilters, type PeerFilterState } from "./PeerDirectoryFilters";
import { PeerDirectoryExport } from "./PeerDirectoryExport";

// Helper functions to serialize/deserialize filters to/from URL params
export function serializePeerFilters(filters: PeerFilterState): URLSearchParams {
  const params = new URLSearchParams();

  if (filters.searchQuery) {
    params.set("filter_peer_id", filters.searchQuery);
  }
  if (filters.selectedVersions.size > 0) {
    params.set("filter_version", Array.from(filters.selectedVersions).join(","));
  }
  if (filters.selectedPubsubProtocols.size > 0) {
    params.set("filter_pubsub", Array.from(filters.selectedPubsubProtocols).join(","));
  }
  if (filters.selectedStreamProtocols.size > 0) {
    params.set("filter_stream", Array.from(filters.selectedStreamProtocols).join(","));
  }
  if (filters.selectedCapabilityCounts.size > 0) {
    params.set("filter_capability_count", Array.from(filters.selectedCapabilityCounts).sort((a, b) => a - b).join(","));
  }

  return params;
}

function deserializePeerFilters(params: URLSearchParams, defaultFilters: PeerFilterState): PeerFilterState {
  const filters = { ...defaultFilters };

  const peerId = params.get("filter_peer_id");
  if (peerId) {
    filters.searchQuery = peerId;
  }

  const versions = params.get("filter_version");
  if (versions) {
    filters.selectedVersions = new Set(versions.split(",").filter(Boolean));
  }

  const pubsub = params.get("filter_pubsub");
  if (pubsub) {
    filters.selectedPubsubProtocols = new Set(pubsub.split(",").filter(Boolean) as Array<"tcp" | "udp" | "other">);
  }

  const stream = params.get("filter_stream");
  if (stream) {
    filters.selectedStreamProtocols = new Set(stream.split(",").filter(Boolean) as Array<"tcp" | "udp" | "other">);
  }

  const capabilityCounts = params.get("filter_capability_count");
  if (capabilityCounts) {
    filters.selectedCapabilityCounts = new Set(
      capabilityCounts.split(",").map(c => parseInt(c, 10)).filter(n => !isNaN(n))
    );
  }

  return filters;
}

interface PeerDirectoryFiltersAndExportProps {
  peerRows: PeerRow[];
  peerRecords: PeerRecord[];
  onFilteredPeersChange?: (filteredPeers: PeerRow[]) => void;
}

export function PeerDirectoryFiltersAndExport({
  peerRows,
  peerRecords,
  onFilteredPeersChange,
}: PeerDirectoryFiltersAndExportProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter state - initialize from URL params
  const defaultFilters: PeerFilterState = {
    searchQuery: "",
    selectedVersions: new Set(),
    selectedPubsubProtocols: new Set<"tcp" | "udp" | "other">(),
    selectedStreamProtocols: new Set<"tcp" | "udp" | "other">(),
    selectedCapabilityCounts: new Set(),
  };

  const filtersInitialized = useRef(false);
  const [filters, setFilters] = useState<PeerFilterState>(() =>
    deserializePeerFilters(searchParams, defaultFilters)
  );

  // Mark as initialized after first render
  useEffect(() => {
    filtersInitialized.current = true;
  }, []);

  // Update URL when filters change (but not on initial mount)
  useEffect(() => {
    if (!filtersInitialized.current) return;

    const newParams = serializePeerFilters(filters);
    const currentParams = new URLSearchParams(searchParams);

    // Remove old peer filter params
    currentParams.delete("filter_peer_id");
    currentParams.delete("filter_version");
    currentParams.delete("filter_pubsub");
    currentParams.delete("filter_stream");
    currentParams.delete("filter_capability_count");

    // Add new peer filter params
    newParams.forEach((value, key) => {
      currentParams.set(key, value);
    });

    // Only update if params actually changed
    const newParamsStr = currentParams.toString();
    const oldParamsStr = searchParams.toString();
    if (newParamsStr !== oldParamsStr) {
      setSearchParams(currentParams, { replace: true });
    }
  }, [filters, searchParams, setSearchParams]);

  // Filter peers excluding version, capability count, and protocol filters (for count calculations)
  const peersForCounts = useMemo(() => {
    return peerRows.filter((peer) => {
      // Search filter only
      if (!matchesSearch(peer, filters.searchQuery)) {
        return false;
      }
      return true;
    });
  }, [peerRows, filters.searchQuery]);

  // Extract unique versions from filtered peers (excluding version filter)
  const uniqueVersions = useMemo(() => {
    const versions = new Set<string>();
    peersForCounts.forEach((peer) => {
      versions.add(peer.version);
    });
    return Array.from(versions).sort(compareVersions);
  }, [peersForCounts]);

  // Count peers per version (based on filtered peers, excluding version filter)
  const versionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    peersForCounts.forEach((peer) => {
      counts.set(peer.version, (counts.get(peer.version) || 0) + 1);
    });
    return counts;
  }, [peersForCounts]);

  // Extract unique capability counts from filtered peers (excluding capability count filter)
  const uniqueCapabilityCounts = useMemo(() => {
    const counts = new Set<number>();
    peersForCounts.forEach((peer) => {
      counts.add(peer.capabilityCount);
    });
    return Array.from(counts).sort((a, b) => a - b);
  }, [peersForCounts]);

  // Count peers per capability count (based on filtered peers, excluding capability count filter)
  const capabilityCountCounts = useMemo(() => {
    const counts = new Map<number, number>();
    peersForCounts.forEach((peer) => {
      counts.set(peer.capabilityCount, (counts.get(peer.capabilityCount) || 0) + 1);
    });
    return counts;
  }, [peersForCounts]);

  // Count peers per pubsub protocol (based on filtered peers, excluding protocol filters)
  const pubsubProtocolCounts = useMemo(() => {
    const counts = new Map<"tcp" | "udp" | "other", number>();
    peersForCounts.forEach((peer) => {
      const protocols = getProtocolsFromAddresses(peer.pubsub);
      protocols.forEach((protocol) => {
        counts.set(protocol, (counts.get(protocol) || 0) + 1);
      });
    });
    return counts;
  }, [peersForCounts]);

  // Count peers per stream protocol (based on filtered peers, excluding protocol filters)
  const streamProtocolCounts = useMemo(() => {
    const counts = new Map<"tcp" | "udp" | "other", number>();
    peersForCounts.forEach((peer) => {
      const protocols = getProtocolsFromAddresses(peer.stream);
      protocols.forEach((protocol) => {
        counts.set(protocol, (counts.get(protocol) || 0) + 1);
      });
    });
    return counts;
  }, [peersForCounts]);

  // Filter peers based on all filters
  const filteredPeers = useMemo(() => {
    return peerRows.filter((peer) => {
      // Search filter
      if (!matchesSearch(peer, filters.searchQuery)) {
        return false;
      }

      // Version filter
      if (filters.selectedVersions.size > 0 && !filters.selectedVersions.has(peer.version)) {
        return false;
      }

      // Pubsub protocol filter
      if (filters.selectedPubsubProtocols.size > 0) {
        const pubsubProtocols = getProtocolsFromAddresses(peer.pubsub);
        const hasSelectedProtocol = Array.from(filters.selectedPubsubProtocols).some((protocol) =>
          pubsubProtocols.has(protocol)
        );
        if (!hasSelectedProtocol) {
          return false;
        }
      }

      // Stream protocol filter
      if (filters.selectedStreamProtocols.size > 0) {
        const streamProtocols = getProtocolsFromAddresses(peer.stream);
        const hasSelectedProtocol = Array.from(filters.selectedStreamProtocols).some((protocol) =>
          streamProtocols.has(protocol)
        );
        if (!hasSelectedProtocol) {
          return false;
        }
      }

      // Capability count filter
      if (filters.selectedCapabilityCounts.size > 0 && !filters.selectedCapabilityCounts.has(peer.capabilityCount)) {
        return false;
      }

      return true;
    });
  }, [peerRows, filters]);

  // Notify parent of filtered peers changes
  useEffect(() => {
    if (onFilteredPeersChange) {
      onFilteredPeersChange(filteredPeers);
    }
  }, [filteredPeers, onFilteredPeersChange]);

  return (
    <>
      <PeerDirectoryFilters
        filters={filters}
        onFiltersChange={setFilters}
        uniqueVersions={uniqueVersions}
        versionCounts={versionCounts}
        uniqueCapabilityCounts={uniqueCapabilityCounts}
        capabilityCountCounts={capabilityCountCounts}
        pubsubProtocolCounts={pubsubProtocolCounts}
        streamProtocolCounts={streamProtocolCounts}
      />

      <PeerDirectoryExport
        filteredPeers={filteredPeers}
        allPeerRecords={peerRecords}
        filters={filters}
      />
    </>
  );
}

// Export a hook version for cases where you need filtered peers but want to render filters/export separately
export function usePeerFilters(
  peerRows: PeerRow[],
  peerRecords: PeerRecord[]
): {
  filters: PeerFilterState;
  setFilters: (filters: PeerFilterState) => void;
  filteredPeers: PeerRow[];
  uniqueVersions: string[];
  versionCounts: Map<string, number>;
  uniqueCapabilityCounts: number[];
  capabilityCountCounts: Map<number, number>;
  pubsubProtocolCounts: Map<"tcp" | "udp" | "other", number>;
  streamProtocolCounts: Map<"tcp" | "udp" | "other", number>;
} {
  const [searchParams, setSearchParams] = useSearchParams();

  const defaultFilters: PeerFilterState = {
    searchQuery: "",
    selectedVersions: new Set(),
    selectedPubsubProtocols: new Set<"tcp" | "udp" | "other">(),
    selectedStreamProtocols: new Set<"tcp" | "udp" | "other">(),
    selectedCapabilityCounts: new Set(),
  };

  const filtersInitialized = useRef(false);
  const [filters, setFiltersState] = useState<PeerFilterState>(() =>
    deserializePeerFilters(searchParams, defaultFilters)
  );

  useEffect(() => {
    filtersInitialized.current = true;
  }, []);

  useEffect(() => {
    if (!filtersInitialized.current) return;

    const newParams = serializePeerFilters(filters);
    const currentParams = new URLSearchParams(searchParams);

    currentParams.delete("filter_peer_id");
    currentParams.delete("filter_version");
    currentParams.delete("filter_pubsub");
    currentParams.delete("filter_stream");
    currentParams.delete("filter_capability_count");

    newParams.forEach((value, key) => {
      currentParams.set(key, value);
    });

    const newParamsStr = currentParams.toString();
    const oldParamsStr = searchParams.toString();
    if (newParamsStr !== oldParamsStr) {
      setSearchParams(currentParams, { replace: true });
    }
  }, [filters, searchParams, setSearchParams]);

  const setFilters = (newFilters: PeerFilterState) => {
    setFiltersState(newFilters);
  };

  const peersForCounts = useMemo(() => {
    return peerRows.filter((peer) => {
      if (!matchesSearch(peer, filters.searchQuery)) {
        return false;
      }
      return true;
    });
  }, [peerRows, filters.searchQuery]);

  const uniqueVersions = useMemo(() => {
    const versions = new Set<string>();
    peersForCounts.forEach((peer) => {
      versions.add(peer.version);
    });
    return Array.from(versions).sort(compareVersions);
  }, [peersForCounts]);

  const versionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    peersForCounts.forEach((peer) => {
      counts.set(peer.version, (counts.get(peer.version) || 0) + 1);
    });
    return counts;
  }, [peersForCounts]);

  const uniqueCapabilityCounts = useMemo(() => {
    const counts = new Set<number>();
    peersForCounts.forEach((peer) => {
      counts.add(peer.capabilityCount);
    });
    return Array.from(counts).sort((a, b) => a - b);
  }, [peersForCounts]);

  const capabilityCountCounts = useMemo(() => {
    const counts = new Map<number, number>();
    peersForCounts.forEach((peer) => {
      counts.set(peer.capabilityCount, (counts.get(peer.capabilityCount) || 0) + 1);
    });
    return counts;
  }, [peersForCounts]);

  const pubsubProtocolCounts = useMemo(() => {
    const counts = new Map<"tcp" | "udp" | "other", number>();
    peersForCounts.forEach((peer) => {
      const protocols = getProtocolsFromAddresses(peer.pubsub);
      protocols.forEach((protocol) => {
        counts.set(protocol, (counts.get(protocol) || 0) + 1);
      });
    });
    return counts;
  }, [peersForCounts]);

  const streamProtocolCounts = useMemo(() => {
    const counts = new Map<"tcp" | "udp" | "other", number>();
    peersForCounts.forEach((peer) => {
      const protocols = getProtocolsFromAddresses(peer.stream);
      protocols.forEach((protocol) => {
        counts.set(protocol, (counts.get(protocol) || 0) + 1);
      });
    });
    return counts;
  }, [peersForCounts]);

  const filteredPeers = useMemo(() => {
    return peerRows.filter((peer) => {
      if (!matchesSearch(peer, filters.searchQuery)) {
        return false;
      }

      if (filters.selectedVersions.size > 0 && !filters.selectedVersions.has(peer.version)) {
        return false;
      }

      if (filters.selectedPubsubProtocols.size > 0) {
        const pubsubProtocols = getProtocolsFromAddresses(peer.pubsub);
        const hasSelectedProtocol = Array.from(filters.selectedPubsubProtocols).some((protocol) =>
          pubsubProtocols.has(protocol)
        );
        if (!hasSelectedProtocol) {
          return false;
        }
      }

      if (filters.selectedStreamProtocols.size > 0) {
        const streamProtocols = getProtocolsFromAddresses(peer.stream);
        const hasSelectedProtocol = Array.from(filters.selectedStreamProtocols).some((protocol) =>
          streamProtocols.has(protocol)
        );
        if (!hasSelectedProtocol) {
          return false;
        }
      }

      if (filters.selectedCapabilityCounts.size > 0 && !filters.selectedCapabilityCounts.has(peer.capabilityCount)) {
        return false;
      }

      return true;
    });
  }, [peerRows, filters]);

  return {
    filters,
    setFilters,
    filteredPeers,
    uniqueVersions,
    versionCounts,
    uniqueCapabilityCounts,
    capabilityCountCounts,
    pubsubProtocolCounts,
    streamProtocolCounts,
  };
}

