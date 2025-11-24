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

export interface PeerReachability {
  filter: string;
  pubsub_multiaddrs: string[];
  stream_multiaddrs: string[];
}

export interface PeerRecord {
  peer_id: string;
  version: string;
  patch_number: string;
  cores: number;
  bandwidth: number;
  last_seen: number;
  capabilities: Array<{
    protocol_identifier: number;
    additional_metadata: string;
  }>;
  reachability: PeerReachability[];
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

export const explorerApi = {
  getLatestFrame: () => request<GlobalFrame>("/frames/latest"),
  getFrame: (frameNumber: number) => request<GlobalFrame>(`/frames/${frameNumber}`),
  getLatestCertified: () => request<CertifiedProposal>("/certified/latest"),
  getCertified: (rank: number) => request<CertifiedProposal>(`/certified/${rank}`),
  getMessages: (limit = 20) => request<GossipMessage[]>(`/messages?limit=${limit}`),
  getVertex: (id: string) => request<HypergraphRecord>(`/hypergraph/vertex/${id}`),
  getHyperedge: (id: string) => request<HypergraphRecord>(`/hypergraph/hyperedge/${id}`),
  getPeers: () => request<PeerRecord[]>("/peers"),
};
