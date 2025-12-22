const BASE_URL = "https://explorer-api.quilibrium.com";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
    },
    ...init,
  });

  if (!res.ok) {
    const message = await res
      .json()
      .catch(() => ({ error: res.statusText }));
    throw new Error(message.error ?? res.statusText ?? "Request failed");
  }

  return res.json() as Promise<T>;
}

export interface GlobalFrame {
  header: {
    frameNumber: number;
    rank: number;
    timestamp: string;
    difficulty: number;
    output: string;
    parentSelector: string;
    proverTreeCommitment?: string;
    globalCommitments?: string[];
    requestsRoot?: string;
    prover: string;
    feeMultiplierVote?: number;
  };
  requests: FrameRequestBundle[];
}

export interface FrameRequestBundle {
  timestamp?: string;
  requests: FrameRequest[];
}

export interface FrameRequest {
  timestamp?: string;
  [key: string]: unknown;
}

export interface ProverAllocation {
  status: string;
  confirmation_filter?: string;
  rejection_filter?: string;
  join_frame_number?: number;
  leave_frame_number?: number;
  pause_frame_number?: number;
  resume_frame_number?: number;
  kick_frame_number?: number;
  join_confirm_frame_number?: number;
  join_reject_frame_number?: number;
  leave_confirm_frame_number?: number;
  leave_reject_frame_number?: number;
  last_active_frame_number?: number;
}

export interface ProverRecord {
  address: string;
  public_key: string;
  delegate_address?: string;
  status: string;
  kick_frame_number?: number;
  available_storage?: number;
  seniority?: number;
  allocations: ProverAllocation[];
}

export interface ProverShardSummary {
  filter: string;
  counts: Record<string, number>;
}

export interface PeerReachability {
  filter: string;
  pubsub_multiaddrs: string[];
  stream_multiaddrs: string[];
}

export interface PeerRecord {
  peer_id: string;
  version: string;
  patch_number: string;
  last_seen: number;
  capabilities: Array<{
    protocol_identifier: number;
    additional_metadata: string;
  }>;
  reachability: PeerReachability[];
}

export interface KeyRegistry {
  identityKey: {
    keyValue: string;
  };
  proverKey: {
    keyValue: string;
  };
  identityToProver: {
    signature: string;
    publicKey: string | null;
  };
  proverToIdentity: {
    signature: string;
    publicKey: string | null;
  };
  keysByPurpose: Record<string, {
    keyPurpose: string;
    x448Keys: Array<{
      key: {
        keyValue: string;
      };
      parentKeyAddress: string;
      ed448Signature: {
        signature: string;
        publicKey: string | null;
      };
      createdAt: string;
      expiresAt: string;
      keyPurpose: string;
    }>;
    decaf448Keys: Array<{
      key: {
        keyValue: string;
      };
      parentKeyAddress: string;
      ed448Signature: {
        signature: string;
        publicKey: string | null;
      };
      createdAt: string;
      expiresAt: string;
      keyPurpose: string;
    }>;
  }>;
  lastUpdated: string;
}

export interface CertifiedProposal {
  state: GlobalFrame;
  parentQuorumCertificate: {
    rank: number;
    selector: string;
    aggregateSignature?: string;
  };
  priorRankTimeoutCertificate?: {
    rank: number;
    selector: string;
  } | null;
  vote?: {
    rank: number;
    identity: string;
    signature: string;
  } | null;
}

export interface GossipMessage {
  timestamp: string;
  from: string;
  bitmask: string;
  seqno: string;
  signature: string;
  key: string;
  data: string;
}

export interface HypergraphRecord {
  id: string;
  app_address: string;
  data_address: string;
  serialized: string;
  size: string;
}

/**
 * Converts a base58 peer ID to hex format
 */
export async function base58ToHex(base58: string): Promise<string> {
  const { base58_to_binary } = await import("base58-js");
  const bytes = base58_to_binary(base58);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export const explorerApi = {
  getLatestFrame: () => request<GlobalFrame>("/frames/latest"),
  getFrame: (frameNumber: number) => request<GlobalFrame>(`/frames/${frameNumber}`),
  getLatestCertified: () => request<CertifiedProposal>("/certified/latest"),
  getCertified: (rank: number) => request<CertifiedProposal>(`/certified/${rank}`),
  getMessages: (limit = 20) => request<GossipMessage[]>(`/messages?limit=${limit}`),
  getVertex: (id: string) => request<HypergraphRecord>(`/hypergraph/vertex/${id}`),
  getHyperedge: (id: string) => request<HypergraphRecord>(`/hypergraph/hyperedge/${id}`),
  getPeers: () => request<PeerRecord[]>("/peers"),
  getProvers: (params?: { address?: string; filter?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.address) query.set("address", params.address);
    if (params?.filter) query.set("filter", params.filter);
    if (params?.status) query.set("status", params.status);
    const qs = query.toString();
    const suffix = qs ? `?${qs}` : "";
    return request<ProverRecord[]>(`/provers${suffix}`);
  },
  getProverShardSummaries: () => request<ProverShardSummary[]>("/provers/shards"),
  getShardProvers: (filter: string) => request<ProverRecord[]>(`/provers/shards/${filter}`),
  getKeyRegistry: (hexIdentity: string) => request<KeyRegistry>(`/keys/identity/${hexIdentity}`),
};
