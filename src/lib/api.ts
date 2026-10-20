const BASE_URL = "https://explorer-api.quilibrium.com";

/** A failed API request, with its HTTP status (404 when nothing is recorded). */
export class ApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
    this.name = "ApiError";
  }
}

export function isNotFound(err: unknown): boolean {
  return err instanceof ApiError && err.status === 404;
}

async function fetchOk(path: string, init?: RequestInit): Promise<Response> {
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
    throw new ApiError(message.error ?? res.statusText ?? "Request failed", res.status);
  }

  return res;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetchOk(path, init);
  return res.json() as Promise<T>;
}

function withQuery(path: string, params: Record<string, string | number | undefined>): string {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") query.set(key, String(value));
  });
  const qs = query.toString();
  return qs ? `${path}?${qs}` : path;
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
  /** Per-bundle materialization outcome, aligned by index to `requests`.
   * Absent/empty until the frame has materialized. */
  requestOutcomes?: RequestOutcome[];
}

export type RequestStatus = "succeeded" | "rejected" | "failed" | "skipped";

export interface RequestOutcome {
  status: RequestStatus;
  /** Short reason for `rejected`/`failed`; empty otherwise. */
  error: string;
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
  size_bytes?: string;
  active_workers?: number;
  data_shards?: number;
}

export interface NetworkStats {
  current_frame: number;
  eviction_threshold: number;
  total_provers: number;
  by_status: Record<string, number>;
  total_seniority: number;
  eviction_pending: number;
  at_risk: number;
  halted_shards: number;
  /** The /shards/production summary; null until the node builds its first index. */
  app_shards?: AppShardsStats | null;
}

/** Exclusive production classes of a live shard over the window. */
export type ProductionClass = "no_data" | "producing" | "below_quorum" | "staffed_not_producing";

export const PRODUCTION_CLASSES: ProductionClass[] = [
  "producing",
  "staffed_not_producing",
  "below_quorum",
  "no_data",
];

export interface ProductionWindow {
  head_frame: number;
  indexed_through: number | null;
  /** GLOBAL frames the window covers. */
  window_frames: number;
  window_complete: boolean;
  index_waiting_frame: number | null;
  median_frame_interval_ms: number | null;
}

export interface ProductionSummary {
  /** Denominator of the class counts: the /provers/shards set. */
  live_shards: number;
  classes: Record<ProductionClass, number>;
  applied_in_window: number;
  inclusions_in_window: number;
  not_applied_in_window: number;
  unknown_outcome_in_window: number;
  drained_in_window: number;
  off_grid_inclusions_in_window: number | null;
  missing_frames_in_window: number;
  outcome_less_frames_in_window: number;
  /** Fees only, not rewards. */
  fees_relayed_in_window_quil: string;
  grid_source: "local_store" | "archive_cache";
  grid_shards: number | null;
  grid_digest: string | null;
  grid_unavailable: string | null;
}

export type AppShardsStats = ProductionWindow & ProductionSummary;

export interface ShardProduction {
  filter: string;
  class: ProductionClass;
  last_applied_app_frame: number | null;
  last_applied_global_frame: number | null;
  last_applied_rank: number | null;
  signers_last: number | null;
  committee_last: number | null;
  /** GLOBAL's executed tip of the head session (drains included). */
  committed_app_head: number | null;
  session_generation: number | null;
  session_members: number | null;
  active_members: number;
  applied_in_window: number;
  inclusions_in_window: number;
  not_applied_in_window: number;
  unknown_outcome_in_window: number;
  drained_in_window: number;
  fees_relayed_in_window_quil: string;
  coverage_halt: boolean;
}

export interface ShardProductionResponse extends ProductionWindow {
  summary: ProductionSummary;
  /** Sorted by filter. */
  shards: ShardProduction[];
}

/** One allocation's eviction runway. */
export interface EvictionRiskEntry {
  address: string;
  seniority: number;
  filter: string;
  last_active_frame_number: number;
  current_frame: number;
  shard_halt_duration: number;
  frames_inactive: number;
  effective_inactive: number;
  eviction_threshold: number;
  frames_until_eviction: number;
  risk_ratio: number;
  /** Past the threshold on a progressing shard, within the shard's minimum provers. */
  eviction_pending: boolean;
  /** At least two thirds of the shard's active allocations are within the
   * threshold; allocations on a stalled shard are exempt from eviction. */
  shard_progressing: boolean;
}

export interface EvictionRiskQuery {
  minRatio?: number;
  address?: string;
  filter?: string;
  limit?: number;
}

export interface EvictionRiskPage {
  entries: EvictionRiskEntry[];
  /** Entries matching the query before `limit`. */
  total: number;
}

export interface SeniorityEntry {
  rank: number;
  address: string;
  seniority: number;
  status: string;
  active_shards: number;
}

export interface KickedEntry {
  address: string;
  public_key: string;
  status: string;
  kick_frame_number: number;
  seniority: number;
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
  getProvers: (params?: { address?: string; filter?: string; status?: string }) =>
    request<ProverRecord[]>(withQuery("/provers", { address: params?.address, filter: params?.filter, status: params?.status })),
  getProverShardSummaries: () => request<ProverShardSummary[]>("/provers/shards"),
  getShardProvers: (filter: string) => request<ProverRecord[]>(`/provers/shards/${filter}`),
  getKeyRegistry: (hexIdentity: string) => request<KeyRegistry>(`/keys/identity/${hexIdentity}`),
  getKeyRegistryByProver: (proverAddress: string) => request<KeyRegistry>(`/keys/prover/${proverAddress}`),
  getStats: () => request<NetworkStats>("/stats"),
  /** Most at risk first. Filters by prover `address` or shard `filter` (hex). */
  getEvictionRisk: async (params?: EvictionRiskQuery): Promise<EvictionRiskPage> => {
    const res = await fetchOk(
      withQuery("/provers/eviction-risk", {
        min_ratio: params?.minRatio && params.minRatio > 0 ? params.minRatio : undefined,
        address: params?.address,
        filter: params?.filter,
        limit: params?.limit,
      })
    );
    const entries = (await res.json()) as EvictionRiskEntry[];
    const total = Number(res.headers.get("X-Total-Count"));
    return { entries, total: Number.isFinite(total) && total > 0 ? total : entries.length };
  },
  /** 503 until the node builds its first production index. */
  getShardProduction: (params?: { class?: ProductionClass; filter?: string }) =>
    request<ShardProductionResponse>(withQuery("/shards/production", { class: params?.class, filter: params?.filter })),
  getSeniority: (limit?: number) => {
    const suffix = limit && limit > 0 ? `?limit=${limit}` : "";
    return request<SeniorityEntry[]>(`/provers/seniority${suffix}`);
  },
  getKicked: () => request<KickedEntry[]>("/provers/kicked"),
};
