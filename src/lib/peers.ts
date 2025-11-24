import { PeerRecord } from "./api";

export interface PeerRow {
  peerId: string;
  version: string;
  pubsub: string[];
  stream: string[];
  capabilityCount: number;
}

export function formatPeerVersion(peer: PeerRecord): string {
  const versionBytes = Array.from(peer.version ?? "").map((ch) => ch.charCodeAt(0));
  const versionCore = versionBytes.length ? versionBytes.join(".") : "0";
  const patchNumber = Number.isNaN(Number.parseInt(peer.patch_number, 16))
    ? 0
    : Number.parseInt(peer.patch_number, 16);
  return `${versionCore}.${patchNumber}`;
}

export function formatPeerRows(peers: PeerRecord[]): PeerRow[] {
  return peers.map((peer) => {
    const reach = peer.reachability?.[0];
    return {
      peerId: peer.peer_id,
      version: formatPeerVersion(peer),
      pubsub: reach?.pubsub_multiaddrs ?? [],
      stream: reach?.stream_multiaddrs ?? [],
      capabilityCount: peer.capabilities?.length ?? 0,
    };
  });
}

export function compareVersions(a: string, b: string): number {
  const parseVersion = (version: string): number[] => {
    return version.split('.').map(segment => {
      const num = parseInt(segment, 10);
      return isNaN(num) ? 0 : num;
    });
  };

  const versionA = parseVersion(a);
  const versionB = parseVersion(b);
  const maxLength = Math.max(versionA.length, versionB.length);

  for (let i = 0; i < maxLength; i++) {
    const segmentA = versionA[i] ?? 0;
    const segmentB = versionB[i] ?? 0;

    if (segmentA < segmentB) return -1;
    if (segmentA > segmentB) return 1;
  }

  return 0;
}

export function getProtocolsFromAddresses(addresses: string[]): Set<"tcp" | "udp" | "other"> {
  const protocols = new Set<"tcp" | "udp" | "other">();

  // If peer has no addresses, mark as "other" (No Address)
  if (addresses.length === 0) {
    protocols.add("other");
    return protocols;
  }

  let hasTcp = false;
  let hasUdp = false;

  addresses.forEach((addr) => {
    if (addr.includes("/tcp/")) {
      hasTcp = true;
    } else if (addr.includes("/udp/")) {
      hasUdp = true;
    }
  });

  if (hasTcp) protocols.add("tcp");
  if (hasUdp) protocols.add("udp");

  return protocols;
}

export function matchesSearch(peer: PeerRow, query: string): boolean {
  if (!query.trim()) return true;
  const lowerQuery = query.toLowerCase().trim();

  // Check peer ID
  if (peer.peerId.toLowerCase().includes(lowerQuery)) {
    return true;
  }

  // Check all addresses for IP matches (IPv4 and IPv6)
  const allAddresses = [...peer.pubsub, ...peer.stream];
  for (const addr of allAddresses) {
    // Extract IP from multiaddr format like /ip4/192.168.1.1/tcp/4001 or /ip6/2001:db8::1/udp/4001
    const ip4Match = addr.match(/\/ip4\/([^/]+)/);
    const ip6Match = addr.match(/\/ip6\/([^/]+)/);

    if (ip4Match && ip4Match[1].includes(lowerQuery)) {
      return true;
    }
    if (ip6Match && ip6Match[1].includes(lowerQuery)) {
      return true;
    }

    // Also check the full address string
    if (addr.toLowerCase().includes(lowerQuery)) {
      return true;
    }
  }

  return false;
}

