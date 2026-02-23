import { useEffect, useMemo, useState } from "react";
import { PageLayout } from "@/components/PageLayout";

interface FrameHighlight {
  frameNumber: number;
  rank: number;
  timestamp: string;
  difficulty: string;
  prover: string;
  feeMultiplier: string;
  requestsRoot: string;
  summary: string;
}

interface StatHighlight {
  label: string;
  value: string;
  description: string;
}

interface FrameTimelineEntry {
  frameNumber: number;
  requests: number;
  shardsTouched: number;
  prover: string;
  selector: string;
  timestamp: string;
  highlights: { label: string; value: string }[];
}

interface AppShardInsight {
  label: string;
  domain: string;
  kind: "token" | "hypergraph" | "compute" | "app";
  frameNumber: number;
  selector: string;
  requestsRoot: string;
  stateRoots: number;
  description: string;
  primaryRequests: string[];
}

interface RequestFlow {
  title: string;
  role: string;
  description: string;
  allowedInGlobal: boolean;
  bundleNotes: string;
}

interface BehaviorFlag {
  name: string;
  identifier: string;
  detail: string;
}

interface MintInsight {
  title: string;
  mechanics: string;
  callout: string;
}

const RELATIVE_TIME_FORMAT = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const ABSOLUTE_TIME_FORMAT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "UTC",
  timeZoneName: "short",
});

function formatRelativeTime(isoTimestamp: string) {
  const now = Date.now();
  const timestamp = new Date(isoTimestamp).getTime();
  const diffSeconds = Math.round((timestamp - now) / 1000);

  const divisions: Array<{ amount: number; unit: Intl.RelativeTimeFormatUnit }> = [
    { amount: 60, unit: "second" },
    { amount: 60, unit: "minute" },
    { amount: 24, unit: "hour" },
    { amount: 7, unit: "day" },
    { amount: 4.34524, unit: "week" },
    { amount: 12, unit: "month" },
    { amount: Infinity, unit: "year" },
  ];

  let duration = diffSeconds;
  let unit: Intl.RelativeTimeFormatUnit = "second";

  for (const division of divisions) {
    if (Math.abs(duration) < division.amount) {
      unit = division.unit;
      break;
    }
    duration /= division.amount;
  }

  return RELATIVE_TIME_FORMAT.format(Math.round(duration), unit);
}

function formatAbsoluteTime(isoTimestamp: string) {
  return ABSOLUTE_TIME_FORMAT.format(new Date(isoTimestamp));
}

function formatBytesLike(hex: string) {
  if (hex.length <= 12) return hex;
  return `${hex.slice(0, 8)}…${hex.slice(-6)}`;
}

function Tag({
  label,
  variant = "primary",
}: {
  label: string;
  variant?: "primary" | "secondary" | "neutral";
}) {
  const palettes: Record<"primary" | "secondary" | "neutral", string> = {
    primary:
      "bg-light-purple/30 text-purple border border-purple/40 dark:bg-purple/10 dark:text-purple dark:border-purple/30",
    secondary:
      "bg-light-green/40 text-green border border-green/30 dark:bg-green/15 dark:text-green dark:border-green/25",
    neutral:
      "bg-beige/80 text-burgundy/70 border border-burgundy/15 dark:bg-white/10 dark:text-white dark:border-white/15",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-sm sm:text-xs font-semibold uppercase tracking-label ${palettes[variant]}`}
    >
      {label}
    </span>
  );
}

export default function Explorer() {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = window.setInterval(() => setTick((tick) => tick + 1), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const globalFrame = useMemo<FrameHighlight>(
    () => ({
      frameNumber: 256_187,
      rank: 413_029,
      timestamp: "2025-11-05T02:01:00Z",
      difficulty: "1,327,911",
      prover: "0xd1f734c26a21…c9ce",
      feeMultiplier: "1.08×",
      requestsRoot: "0x890bfef3f409e8b0cbf41a27847cbdf1e9df0da7",
      summary:
        "Global frame 256,187 committed 226 requests across token, hypergraph, compute, and messaging shards. Every shard replays this frame number to keep deterministic ordering.",
    }),
    []
  );

  const stats = useMemo<StatHighlight[]>(
    () => [
      {
        label: "Global frame",
        value: `#${globalFrame.frameNumber.toLocaleString()}`,
        description: "Strict monotonic counter for worldwide commitments.",
      },
      {
        label: "Rank",
        value: globalFrame.rank.toLocaleString(),
        description: "Determines leadership rotation for provers.",
      },
      {
        label: "Difficulty",
        value: globalFrame.difficulty,
        description: "Smoothed from the trailing 60 timestamps.",
      },
      {
        label: "Fee multiplier",
        value: globalFrame.feeMultiplier,
        description: "Active vote carried inside the frame header.",
      },
      {
        label: "Requests root",
        value: formatBytesLike(globalFrame.requestsRoot),
        description: "Poseidon hash of every request within the frame.",
      },
      {
        label: "Last updated",
        value: formatAbsoluteTime(globalFrame.timestamp),
        description: "",
      },
      {
        label: "Tokens deployed",
        value: "1,842",
        description: "Total TokenDeploy configurations observed on the network.",
      },
      {
        label: "Applications deployed",
        value: "368",
        description: "App shard domains registered through Application deploy flows.",
      },
      {
        label: "Hypergraph partitions deployed",
        value: "1,024",
        description: "Distinct HypergraphDeploy partitions currently active.",
      },
    ],
    [globalFrame]
  );

  const frameTimeline = useMemo<FrameTimelineEntry[]>(
    () => [
      {
        frameNumber: 256_187,
        requests: 226,
        shardsTouched: 62,
        prover: "0xd1f734c26a21…c9ce",
        selector: "0xa34eb7eabb8ab98c5058c532ebd2cb19",
        timestamp: "2025-11-05T02:01:00Z",
        highlights: [
          { label: "Deploy bundles", value: "14" },
          { label: "Shard headers", value: "58" },
          { label: "Intrinsic ops", value: "154" },
        ],
      },
      {
        frameNumber: 256_186,
        requests: 211,
        shardsTouched: 60,
        prover: "0x41ad5f88095e…11f2",
        selector: "0xf419dc8a440d62cc83e8b760003dddc7",
        timestamp: "2025-11-05T01:59:00Z",
        highlights: [
          { label: "Deploy bundles", value: "9" },
          { label: "Shard headers", value: "52" },
          { label: "Intrinsic ops", value: "150" },
        ],
      },
      {
        frameNumber: 256_185,
        requests: 198,
        shardsTouched: 58,
        prover: "0x8934a1c2fb12…c0af",
        selector: "0x1dc4f7e0988541d8a01c32f3fb6a8235",
        timestamp: "2025-11-05T01:57:00Z",
        highlights: [
          { label: "Deploy bundles", value: "7" },
          { label: "Shard headers", value: "46" },
          { label: "Intrinsic ops", value: "145" },
        ],
      },
      {
        frameNumber: 256_184,
        requests: 231,
        shardsTouched: 63,
        prover: "0xf7c134fc9125…8aa1",
        selector: "0xaa17b580bc3d0e9f4a55b514c52b72ef",
        timestamp: "2025-11-05T01:55:00Z",
        highlights: [
          { label: "Deploy bundles", value: "11" },
          { label: "Shard headers", value: "60" },
          { label: "Intrinsic ops", value: "160" },
        ],
      },
    ],
    []
  );

  const shardInsights = useMemo<AppShardInsight[]>(
    () => [
      {
        label: "Intrinsic · Token ledger",
        domain: "0xaa54…00aa",
        kind: "token",
        frameNumber: 256_187,
        selector: "0xbbb49c4311190feb46200048bc7250eb",
        requestsRoot: "0x7e511f09c78d2ddbc2ac56644e9ade18",
        stateRoots: 3,
        description:
          "Enforces supply, pending flows, and fee paths for QU governance instruments and acceptable tokens.",
        primaryRequests: ["TokenDeploy", "Transaction", "PendingTransaction", "MintTransaction"],
      },
      {
        label: "Intrinsic · Hypergraph registry",
        domain: "0xcc12…10cc",
        kind: "hypergraph",
        frameNumber: 256_187,
        selector: "0xc6def82b49bafc5827f7c64629de2572",
        requestsRoot: "0xd8a13528f901bb271419c7fc260c6e43",
        stateRoots: 5,
        description:
          "Maintains the vertex + hyperedge commitment trees backing HypergraphDeploy, VertexAdd, and HyperedgeAdd.",
        primaryRequests: ["HypergraphDeploy", "VertexAdd", "HyperedgeAdd", "VertexRemove"],
      },
      {
        label: "Intrinsic · Compute",
        domain: "0xdd01…00dd",
        kind: "compute",
        frameNumber: 256_187,
        selector: "0x97cc3c8aaf3e18eb1b0031736ce713c0",
        requestsRoot: "0x6dac92ee5a6f509aca64ab35f8a7319d",
        stateRoots: 2,
        description:
          "Records ComputeDeploy, CodeDeployment, and CodeExecute operations plus DAG dependencies.",
        primaryRequests: ["ComputeDeploy", "CodeDeployment", "CodeExecute", "CodeFinalize"],
      },
      {
        label: "App shard · Messaging",
        domain: "0xabff…0cab",
        kind: "app",
        frameNumber: 256_187,
        selector: "0xa2f59115850f14f6b1acfe9e91d777a2",
        requestsRoot: "0xe6129dfb40de0ce54ea74f8d89f270c1",
        stateRoots: 1,
        description:
          "Captures MessageBundles that synchronize inbox CRDTs and the hub association 2P-set.",
        primaryRequests: ["MessageBundle", "HubAddInboxMessage", "HubDeleteInboxMessage"],
      },
    ],
    []
  );

  const intrinsicShardCards = useMemo(
    () => shardInsights.filter((shard) => shard.kind !== "app"),
    [shardInsights]
  );
  const appShardCards = useMemo(
    () => shardInsights.filter((shard) => shard.kind === "app"),
    [shardInsights]
  );

  const requestFlows = useMemo<RequestFlow[]>(
    () => [
      {
        title: "Deployments",
        role: "TokenDeploy · HypergraphDeploy · ComputeDeploy",
        description:
          "Global frames accept deploys and the configuration payload that defines each intrinsic domain. Any follow-on update must reference the deploy it depends on within the same bundle.",
        allowedInGlobal: true,
        bundleNotes: "Always legal globally; shards replay only the headers.",
      },
      {
        title: "Token flows",
        role: "Transaction · PendingTransaction · MintTransaction",
        description:
          "After the bootstrap deploy, coin movements remain in app shard frames keyed to the token domain. Pending transactions track expiration timestamps alongside refund recipients.",
        allowedInGlobal: false,
        bundleNotes: "Allowed globally only if the bundle creates the token.",
      },
      {
        title: "Hypergraph operations",
        role: "VertexAdd/Remove · HyperedgeAdd/Remove",
        description:
          "Shards that own the referenced domain will see identical frame numbers so vector commitment proofs remain deterministic.",
        allowedInGlobal: false,
        bundleNotes: "Global frame includes only the shard header to pay the provers.",
      },
      {
        title: "Compute DAG",
        role: "CodeDeployment · CodeExecute · CodeFinalize",
        description:
          "Execution dependencies cite read/write sets and rendezvous ids. CodeExecute may appear in multiple shard frames if it straddles app domains.",
        allowedInGlobal: false,
        bundleNotes: "Deploys global, execution stays in shards.",
      },
      {
        title: "Prover lifecycle",
        role: "ProverJoin · ProverLeave · ProverPause · ProverResume · ProverKick",
        description:
          "These requests adjust prover filters, update the rolling frecency tries, and ensure quorum formation stays synchronized with the prover tree commitments.",
        allowedInGlobal: true,
        bundleNotes: "Filters derive from global requests only.",
      },
    ],
    []
  );

  const behaviorFlags = useMemo<BehaviorFlag[]>(
    () => [
      {
        name: "Mintable",
        identifier: "TOKEN_BEHAVIOR_MINTABLE",
        detail: "Supply increases until the configured ceiling is reached via the mint strategy.",
      },
      {
        name: "Burnable",
        identifier: "TOKEN_BEHAVIOR_BURNABLE",
        detail: "Anyone with a valid coin can destroy it, lowering total supply.",
      },
      {
        name: "Divisible",
        identifier: "TOKEN_BEHAVIOR_DIVISIBLE",
        detail: "Balances store big.Int units so fractional denominations become possible.",
      },
      {
        name: "Acceptable",
        identifier: "TOKEN_BEHAVIOR_ACCEPTABLE",
        detail: "Movements stage as PendingTransactions awaiting recipient approval.",
      },
      {
        name: "Expirable",
        identifier: "TOKEN_BEHAVIOR_EXPIRABLE",
        detail: "Pending flows can set expiration windows; post-expiry only the refund address can accept.",
      },
      {
        name: "Tenderable",
        identifier: "TOKEN_BEHAVIOR_TENDERABLE",
        detail: "Makes the token valid as a fee instrument on alternative-fee shards.",
      },
    ],
    []
  );

  const mintInsights = useMemo<MintInsight[]>(
    () => [
      {
        title: "Mint with proof",
        mechanics: "TokenMintBehavior.MINT_WITH_PROOF + ProofBasisType.PROOF_OF_MEANINGFUL_WORK",
        callout:
          "Requires provers or minters to maintain proof entries inside the domain; ties supply changes to real computation.",
      },
      {
        title: "Mint with authority",
        mechanics: "TokenMintBehavior.MINT_WITH_AUTHORITY",
        callout:
          "Configuration-defined BLS48-581 keys sign mint requests. Useful for committees managing collateral-backed tokens.",
      },
      {
        title: "Mint with signature",
        mechanics: "TokenMintBehavior.MINT_WITH_SIGNATURE",
        callout:
          "Static signature embedded in the config; best when minting is rare but still automated.",
      },
      {
        title: "Mint with payment",
        mechanics: "TokenMintBehavior.MINT_WITH_PAYMENT + FeeBasisType.PER_UNIT",
        callout:
          "Links minting to a payment address plus a per-unit fee baseline, enabling purchase flows at deploy time.",
      },
    ],
    []
  );

  return (
    <>
      <PageLayout title="Quilibrium Explorer">
        <div className="relative mx-auto max-w-6xl px-6">
          <section className="section-glow-a relative overflow-hidden rounded-3xl border border-subtle bg-surface p-10 text-burgundy shadow-xl backdrop-blur-lg dark:text-white">
            <div className="relative flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1 space-y-6">
                <div className="inline-flex flex-wrap items-center gap-3 rounded-full border border-burgundy/15 bg-light-grey px-4 py-2 text-sm sm:text-xs font-semibold uppercase tracking-label text-burgundy/70 dark:bg-surface-subtle dark:text-white/70">
                  Quilibrium network explorer
                  <span
                    className="flex items-center gap-1 text-xs tracking-normal text-muted"
                    title={formatAbsoluteTime(globalFrame.timestamp)}
                  >
                    <span className="relative inline-flex h-2.5 w-2.5">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green/60 opacity-75" />
                      <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green" />
                    </span>
                    Updated {formatRelativeTime(globalFrame.timestamp)}
                  </span>
                </div>
                <h1 className="text-4xl font-semibold text-burgundy lg:text-5xl dark:text-white">
                  Frames, provers, and shard flow at a glance
                </h1>
                <p className="max-w-2xl text-base leading-relaxed text-secondary">
                  {globalFrame.summary}
                </p>
              </div>

              <div className="flex flex-col gap-4 rounded-2xl border border-default bg-surface-raised p-6 text-sm dark:text-white">
                <div className="label-text">
                  Prover
                </div>
                <div className="text-xl font-semibold text-primary">{globalFrame.prover}</div>
                <div className="label-text">
                  Requests root
                </div>
                <div className="text-xl font-semibold text-primary">
                  {formatBytesLike(globalFrame.requestsRoot)}
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-default bg-white px-4 py-5 dark:bg-surface-raised"
                >
                  <div className="label-text">
                    {stat.label}
                  </div>
                  <div className="mt-2 text-xl font-semibold text-primary">
                    {stat.value}
                  </div>
                  {stat.description && (
                    <p className="text-sm text-secondary">{stat.description}</p>
                  )}
                </div>
              ))}
            </div>
          </section>

          <section className="mt-14 space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-3xl font-semibold text-primary">Frame feed</h2>
                <p className="text-sm text-secondary">
                  Chronological stream of recently finalized global frames, including which shards were touched.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {frameTimeline.map((frame) => (
                <div
                  key={frame.frameNumber}
                  className="rounded-3xl border border-subtle bg-surface p-6 shadow-xl backdrop-blur"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <Tag label={`Frame ${frame.frameNumber.toLocaleString()}`} variant="primary" />
                    <Tag label={`${frame.requests} requests`} variant="neutral" />
                    <Tag label={`${frame.shardsTouched} shards`} variant="secondary" />
                  </div>
                  <div className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
                    <div className="rounded-2xl border border-default bg-white px-4 py-3 text-burgundy dark:bg-surface-raised dark:text-white">
                      <div className="label-text">
                        Prover
                      </div>
                      <div className="text-base font-semibold">{frame.prover}</div>
                    </div>
                    <div className="rounded-2xl border border-default bg-white px-4 py-3 text-burgundy dark:bg-surface-raised dark:text-white">
                      <div className="label-text">
                        Selector
                      </div>
                      <div className="text-base font-semibold">{formatBytesLike(frame.selector)}</div>
                    </div>
                    <div className="rounded-2xl border border-default bg-white px-4 py-3 text-burgundy dark:bg-surface-raised dark:text-white">
                      <div className="label-text">
                        Finalized
                      </div>
                      <div className="text-base font-semibold">
                        {formatAbsoluteTime(frame.timestamp)} ({formatRelativeTime(frame.timestamp)})
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
                    {frame.highlights.map((highlight) => (
                      <div
                        key={`${frame.frameNumber}-${highlight.label}`}
                        className="rounded-2xl border border-subtle bg-light-grey px-4 py-3 text-burgundy/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:bg-surface-raised/60 dark:text-white/70"
                      >
                        <div className="label-text">
                          {highlight.label}
                        </div>
                        <div className="text-base font-semibold text-primary">
                          {highlight.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-14 space-y-10">
            <div>
              <h2 className="text-3xl font-semibold text-primary">Shard directories</h2>
              <p className="text-sm text-secondary">
                Global frames reference 256 commitments; each shard replays the same frame number but filters to the domains listed below.
              </p>
            </div>

            {intrinsicShardCards.length > 0 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-primary">Intrinsic shards</h3>
                  <p className="text-sm text-secondary">
                    Token, hypergraph, and compute intrinsics define the rules that every application shard honors.
                  </p>
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                  {intrinsicShardCards.map((shard) => (
                    <div
                      key={shard.domain}
                      className="relative flex flex-col gap-5 rounded-3xl border border-subtle bg-surface p-6 shadow-xl backdrop-blur"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <Tag label={shard.label} />
                        <Tag label="intrinsic" variant="neutral" />
                      </div>
                      <p className="text-sm text-secondary">{shard.description}</p>
                      <div className="grid gap-4 text-sm sm:grid-cols-2">
                        <div className="rounded-2xl border border-default bg-white px-4 py-3 text-burgundy dark:bg-surface-raised dark:text-white">
                          <div className="label-text">
                            Frame · Selector
                          </div>
                          <div className="text-base font-semibold">#{shard.frameNumber.toLocaleString()}</div>
                          <div className="text-sm sm:text-xs text-muted">{formatBytesLike(shard.selector)}</div>
                        </div>
                        <div className="rounded-2xl border border-default bg-white px-4 py-3 text-burgundy dark:bg-surface-raised dark:text-white">
                          <div className="label-text">
                            Requests root · State roots
                          </div>
                          <div className="text-base font-semibold">{formatBytesLike(shard.requestsRoot)}</div>
                          <div className="text-sm sm:text-xs text-muted">{shard.stateRoots} roots</div>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-subtle bg-light-grey px-4 py-3 text-sm text-burgundy/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:bg-surface-raised/60 dark:text-white/80">
                        <span className="font-semibold">Requests:</span> {shard.primaryRequests.join(", ")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {appShardCards.length > 0 && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold text-primary">Application shards</h3>
                  <p className="text-sm text-secondary">
                    Application-specific shards inherit intrinsic rules while anchoring their own request roots.
                  </p>
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                  {appShardCards.map((shard) => (
                    <div
                      key={shard.domain}
                      className="relative flex flex-col gap-5 rounded-3xl border border-subtle bg-surface p-6 shadow-xl backdrop-blur"
                    >
                      <div className="flex flex-wrap items-center gap-3">
                        <Tag label={shard.label} />
                        <Tag label="app shard" variant="neutral" />
                      </div>
                      <p className="text-sm text-secondary">{shard.description}</p>
                      <div className="grid gap-4 text-sm sm:grid-cols-2">
                        <div className="rounded-2xl border border-default bg-white px-4 py-3 text-burgundy dark:bg-surface-raised dark:text-white">
                          <div className="label-text">
                            Frame · Selector
                          </div>
                          <div className="text-base font-semibold">#{shard.frameNumber.toLocaleString()}</div>
                          <div className="text-sm sm:text-xs text-muted">{formatBytesLike(shard.selector)}</div>
                        </div>
                        <div className="rounded-2xl border border-default bg-white px-4 py-3 text-burgundy dark:bg-surface-raised dark:text-white">
                          <div className="label-text">
                            Requests root · State roots
                          </div>
                          <div className="text-base font-semibold">{formatBytesLike(shard.requestsRoot)}</div>
                          <div className="text-sm sm:text-xs text-muted">{shard.stateRoots} roots</div>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-subtle bg-light-grey px-4 py-3 text-sm text-burgundy/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:bg-surface-raised/60 dark:text-white/80">
                        <span className="font-semibold">Requests:</span> {shard.primaryRequests.join(", ")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section className="mt-16 grid gap-10 lg:grid-cols-[2fr,1fr]">
            <div className="rounded-3xl border border-subtle bg-surface p-6 shadow-lg">
              <h2 className="text-2xl font-semibold text-primary">Request routing</h2>
              <p className="text-sm text-secondary">
                MessageRequest bundles carry precise constraints to keep deploys auditable while allowing shards to scale horizontally.
              </p>
              <div className="mt-6 space-y-4">
                {requestFlows.map((flow) => (
                  <div
                    key={flow.title}
                    className="rounded-2xl border border-default bg-white px-5 py-4 dark:bg-surface-raised"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-lg font-semibold text-primary">{flow.title}</h3>
                      <Tag label={flow.allowedInGlobal ? "Global frame" : "Shard frame"} variant={flow.allowedInGlobal ? "secondary" : "neutral"} />
                    </div>
                    <p className="label-text">
                      {flow.role}
                    </p>
                    <p className="mt-2 text-sm text-secondary">{flow.description}</p>
                    <div className="mt-2 label-text">
                      {flow.bundleNotes}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-subtle bg-surface p-6 shadow-lg">
              <h2 className="text-2xl font-semibold text-primary">Frame payload reference</h2>
              <p className="text-sm text-secondary">
                Quick reference for how specific frames combined deploys, shard headers, and intrinsic operations.
              </p>
              <div className="mt-6 space-y-5">
                {frameTimeline.slice(0, 3).map((frame) => (
                  <div
                    key={`bundle-${frame.frameNumber}`}
                    className="rounded-2xl border border-default bg-white px-4 py-4 text-sm dark:bg-surface-raised"
                  >
                    <div className="text-base font-semibold text-primary">
                      Bundle · Frame {frame.frameNumber.toLocaleString()}
                    </div>
                    <div className="label-text">
                      Selector {formatBytesLike(frame.selector)}
                    </div>
                    <p className="mt-2 text-secondary">
                      {frame.requests} requests · {frame.shardsTouched} shards touched
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-16 grid gap-10 lg:grid-cols-2">
            <div className="rounded-3xl border border-subtle bg-surface p-6 shadow-lg">
              <h2 className="text-2xl font-semibold text-primary">Token intrinsic behavior</h2>
              <p className="text-sm text-secondary">
                Bit flags combine to describe how an issued token behaves at runtime.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {behaviorFlags.map((flag) => (
                  <div
                    key={flag.identifier}
                    className="rounded-2xl border border-default bg-white px-4 py-4 text-sm text-burgundy dark:bg-surface-raised dark:text-white"
                  >
                    <div className="label-text">
                      {flag.identifier}
                    </div>
                    <div className="mt-2 text-base font-semibold">{flag.name}</div>
                    <p className="text-sm text-secondary">{flag.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-subtle bg-surface p-6 shadow-lg">
              <h2 className="text-2xl font-semibold text-primary">Mint strategies</h2>
              <p className="text-sm text-secondary">
                TokenMintBehavior pairs with ProofBasisType and FeeBasisType to define who controls supply.
              </p>
              <div className="mt-6 space-y-4">
                {mintInsights.map((insight) => (
                  <div
                    key={insight.title}
                    className="rounded-2xl border border-default bg-white px-4 py-4 text-sm text-burgundy dark:bg-surface-raised dark:text-white"
                  >
                    <div className="text-base font-semibold">{insight.title}</div>
                    <div className="label-text">
                      {insight.mechanics}
                    </div>
                    <p className="mt-2 text-sm text-secondary">{insight.callout}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </PageLayout>
    </>
  );
}
