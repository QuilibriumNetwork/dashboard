import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";

import {
  CertifiedProposal,
  GlobalFrame,
  GossipMessage,
  HypergraphRecord,
  explorerApi,
} from "@/lib/api";
import {
  formatBase64Bytes,
  formatTimestamp,
  formatRelative,
} from "@/lib/format";

function Tag({ label }: { label: string }) {
  return (
    <span className="inline-flex rounded-full border border-burgundy/20 bg-light-grey px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/70 dark:border-white/15 dark:bg-[#261732] dark:text-white/70">
      {label}
    </span>
  );
}

interface FrameSearchState {
  frame?: GlobalFrame;
  error?: string;
}

interface CertifiedSearchState {
  proposal?: CertifiedProposal;
  error?: string;
}

interface HypergraphSearchState {
  vertex?: HypergraphRecord;
  hyperedge?: HypergraphRecord;
  error?: string;
}

export default function Explorer() {
  const navigate = useNavigate();
  const [latestFrame, setLatestFrame] = useState<GlobalFrame | null>(null);
  const [frameFeed, setFrameFeed] = useState<GlobalFrame[]>([]);
  const [certified, setCertified] = useState<CertifiedProposal | null>(null);
  const [messages, setMessages] = useState<GossipMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [frameQuery, setFrameQuery] = useState("");
  const [frameLookup, setFrameLookup] = useState<FrameSearchState>({});

  const [certifiedQuery, setCertifiedQuery] = useState("");
  const [certifiedLookup, setCertifiedLookup] = useState<CertifiedSearchState>({});

  const [hypergraphQuery, setHypergraphQuery] = useState("");
  const [hypergraphLookup, setHypergraphLookup] = useState<HypergraphSearchState>({});

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [frame, proposal, gossip] = await Promise.all([
          explorerApi.getLatestFrame(),
          explorerApi.getLatestCertified().catch(() => null),
          explorerApi.getMessages(20).catch(() => []),
        ]);
        if (!mounted) {
          return;
        }
        setLatestFrame(frame);
        setCertified(proposal);
        setMessages(gossip);
        await hydrateFrameFeed(frame);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : "Failed to load explorer data");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    async function hydrateFrameFeed(baseFrame: GlobalFrame) {
      const latestNumber = baseFrame.header.frameNumber;
      const counts = Array.from({ length: 10 }, (_, idx) => latestNumber - idx).filter((n) => n > 0);
      const frames: GlobalFrame[] = [];
      for (const num of counts) {
        try {
          if (num === latestNumber) {
            frames.push(baseFrame);
          } else {
            const f = await explorerApi.getFrame(num);
            frames.push(f);
          }
        } catch (err) {
          console.warn("Failed to load frame", num, err);
        }
      }
      setFrameFeed(frames);
    }

    load();
    const interval = window.setInterval(load, 30_000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const latestHeader = latestFrame?.header;

  const frameFeedRows = useMemo(() => frameFeed.map((frame) => {
    const { header } = frame;
    return {
      frameNumber: header.frameNumber,
      requests: frame.requests?.length ?? 0,
      shardsTouched: header.globalCommitments?.length ?? 0,
      prover: header.prover,
      selector: header.parentSelector,
      timestamp: header.timestamp,
    };
  }), [frameFeed]);

  async function handleFrameLookup(event: React.FormEvent) {
    event.preventDefault();
    setFrameLookup({});
    const value = Number(frameQuery);
    if (!Number.isFinite(value) || value < 0) {
      setFrameLookup({ error: "Enter a valid frame number" });
      return;
    }
    try {
      const frame = await explorerApi.getFrame(value);
      setFrameLookup({ frame });
    } catch (err) {
      setFrameLookup({ error: err instanceof Error ? err.message : "Frame lookup failed" });
    }
  }

  async function handleCertifiedLookup(event: React.FormEvent) {
    event.preventDefault();
    setCertifiedLookup({});
    const value = Number(certifiedQuery);
    if (!Number.isFinite(value) || value < 0) {
      setCertifiedLookup({ error: "Enter a valid rank" });
      return;
    }
    try {
      const proposal = await explorerApi.getCertified(value);
      setCertifiedLookup({ proposal });
    } catch (err) {
      setCertifiedLookup({ error: err instanceof Error ? err.message : "Certified lookup failed" });
    }
  }

  async function handleHypergraphLookup(event: React.FormEvent) {
    event.preventDefault();
    setHypergraphLookup({});
    if (!hypergraphQuery || hypergraphQuery.length !== 64 * 2) {
      setHypergraphLookup({ error: "ID must be 64-byte hex (128 chars)" });
      return;
    }
    try {
      const [vertex, hyperedge] = await Promise.all([
        explorerApi.getVertex(hypergraphQuery).catch(() => undefined),
        explorerApi.getHyperedge(hypergraphQuery).catch(() => undefined),
      ]);
      setHypergraphLookup({ vertex, hyperedge });
    } catch (err) {
      setHypergraphLookup({ error: err instanceof Error ? err.message : "Lookup failed" });
    }
  }

  return (
    <>
      <Helmet>
        <title>Quilibrium Explorer</title>
      </Helmet>

      <div className="relative min-h-screen bg-beige pb-24 pt-16 dark:bg-[#100418]">
        <div className="pointer-events-none absolute -left-16 top-10 h-72 w-72 rounded-full bg-light-purple/60 blur-3xl dark:bg-purple/40" />
        <div className="pointer-events-none absolute -right-24 top-32 h-80 w-80 rounded-full bg-light-blue/70 blur-3xl dark:bg-blue/40" />
        <div className="pointer-events-none absolute left-1/2 top-[420px] h-80 w-80 -translate-x-1/2 rounded-full bg-light-green/60 blur-3xl dark:bg-green/30" />

        <div className="relative mx-auto max-w-6xl px-6">
          <section className="relative overflow-hidden rounded-3xl border border-burgundy/10 bg-white/95 p-10 text-burgundy shadow-[0_35px_80px_-50px_rgba(57,31,91,0.45)] backdrop-blur-lg dark:border-white/10 dark:bg-[#1a0f27]/95 dark:text-white dark:shadow-[0_40px_90px_-55px_rgba(8,4,20,0.7)]">
            <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-pink/40 blur-3xl dark:bg-pink/30" />
            <div className="pointer-events-none absolute left-6 top-8 h-24 w-24 rounded-full bg-light-purple/80 blur-2xl dark:bg-purple/40" />

            <div className="relative space-y-6">
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.35em] text-burgundy/70 dark:text-white/70">
                <Tag label="Global frame" />
                <span>
                  Rank #{latestHeader?.rank.toLocaleString() ?? "–"}
                </span>
                {latestHeader?.timestamp && (
                  <span className="text-[0.7rem] tracking-[0.2em] text-burgundy/60 dark:text-white/60">
                    {formatTimestamp(latestHeader.timestamp)} ({formatRelative(latestHeader.timestamp)})
                  </span>
                )}
              </div>
              {error && (
                <div className="rounded-2xl border border-pink/30 bg-light-pink/40 p-4 text-sm text-pink">
                  {error}
                </div>
              )}
              <div className="grid gap-6 md:grid-cols-2">
                <div className="rounded-2xl border border-burgundy/10 bg-white/95 p-6 shadow-[0_26px_70px_-55px_rgba(64,0,27,0.5)] dark:border-white/10 dark:bg-[#211430]/95 dark:text-white">
                  <div className="text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60">Frame Number</div>
                  <div className="mt-2 text-3xl font-semibold text-burgundy dark:text-white">
                    {latestHeader?.frameNumber?.toLocaleString() ?? "–"}
                  </div>
                  <div className="text-sm text-burgundy/70 dark:text-white/70">
                    Difficulty {latestHeader?.difficulty ?? "–"}
                  </div>
                </div>
                <div className="rounded-2xl border border-burgundy/10 bg-white/95 p-6 shadow-[0_26px_70px_-55px_rgba(64,0,27,0.5)] dark:border-white/10 dark:bg-[#211430]/95 dark:text-white">
                  <div className="text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60">Prover</div>
                  <div className="mt-2 text-2xl font-semibold text-burgundy dark:text-white font-mono">
                    {formatBase64Bytes(latestHeader?.prover)}
                  </div>
                </div>
              </div>
              <div className="grid gap-4 text-sm md:grid-cols-2">
                <div className="rounded-2xl border border-burgundy/10 bg-white px-4 py-4 text-burgundy shadow-[0_20px_55px_-45px_rgba(64,0,27,0.5)] dark:border-white/10 dark:bg-[#211430] dark:text-white">
                  <div className="text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-burgundy/60 dark:text-white/60">Requests root</div>
                  <div className="text-lg font-semibold font-mono">{formatBase64Bytes(latestHeader?.requestsRoot)}</div>
                </div>
                <div className="rounded-2xl border border-burgundy/10 bg-white px-4 py-4 text-burgundy shadow-[0_20px_55px_-45px_rgba(64,0,27,0.5)] dark:border-white/10 dark:bg-[#211430] dark:text-white">
                  <div className="text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-burgundy/60 dark:text-white/60">Parent selector</div>
                  <div className="text-lg font-semibold font-mono">{formatBase64Bytes(latestHeader?.parentSelector)}</div>
                </div>
              </div>
              {loading && <div className="text-sm text-burgundy/70 dark:text-white/70">Refreshing explorer data…</div>}
            </div>
          </section>

          <section className="mt-14 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-3xl font-semibold text-burgundy dark:text-white">Frame feed</h2>
            </div>
            <div className="rounded-3xl border border-burgundy/10 bg-white/95 p-6 shadow-[0_34px_80px_-55px_rgba(57,31,91,0.4)] dark:border-white/10 dark:bg-[#1a0f27]/95 dark:shadow-[0_40px_90px_-55px_rgba(0,0,0,0.65)]">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-burgundy/10 text-left text-sm text-burgundy dark:divide-white/10 dark:text-white">
                  <thead className="text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60">
                    <tr>
                      <th className="py-3 pr-6">Frame</th>
                      <th className="py-3 pr-6">Requests</th>
                      <th className="py-3 pr-6">Prover</th>
                      <th className="py-3 pr-6">Selector</th>
                      <th className="py-3 pr-6">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-burgundy/10 dark:divide-white/10">
                    {frameFeedRows.map((row) => (
                      <tr
                        key={row.frameNumber}
                        className="text-sm cursor-pointer transition hover:bg-light-grey/60 dark:hover:bg-white/5"
                        onClick={() => navigate(`/frames/${row.frameNumber}`)}
                      >
                        <td className="py-4 pr-6 font-semibold text-burgundy dark:text-white">
                          #{row.frameNumber.toLocaleString()}
                        </td>
                        <td className="py-4 pr-6">{row.requests}</td>
                        <td className="py-4 pr-6 font-mono">{formatBase64Bytes(row.prover)}</td>
                        <td className="py-4 pr-6 font-mono">{formatBase64Bytes(row.selector)}</td>
                        <td className="py-4 pr-6">{formatTimestamp(row.timestamp)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
{/* 
          <section className="mt-14 space-y-6">
            <h2 className="text-3xl font-semibold text-burgundy dark:text-white">Recent frames</h2>
            <div className="grid gap-6 lg:grid-cols-2">
              {frameFeed.slice(0, 4).map((frame) => (
                <div
                  key={frame.header.frameNumber}
                  className="flex flex-col gap-5 rounded-3xl border border-burgundy/10 bg-white/95 p-6 shadow-[0_34px_80px_-55px_rgba(57,31,91,0.4)] backdrop-blur dark:border-white/10 dark:bg-[#1a0f27]/95 dark:shadow-[0_40px_90px_-55px_rgba(0,0,0,0.65)]"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <Tag label={`Frame ${frame.header.frameNumber.toLocaleString()}`} />
                  </div>
                  <div className="grid gap-4 text-sm sm:grid-cols-2">
                    <div className="rounded-2xl border border-burgundy/10 bg-white px-4 py-3 text-burgundy shadow-[0_20px_55px_-45px_rgba(64,0,27,0.5)] dark:border-white/10 dark:bg-[#211430] dark:text-white">
                      <div className="text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-burgundy/60 dark:text-white/60">
                        Prover
                      </div>
                      <div className="text-base font-semibold font-mono">{formatBase64Bytes(frame.header.prover)}</div>
                    </div>
                    <div className="rounded-2xl border border-burgundy/10 bg-white px-4 py-3 text-burgundy shadow-[0_20px_55px_-45px_rgba(64,0,27,0.5)] dark:border-white/10 dark:bg-[#211430] dark:text-white">
                      <div className="text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-burgundy/60 dark:text-white/60">
                        Selector
                      </div>
                      <div className="text-base font-semibold font-mono">{formatBase64Bytes(frame.header.parentSelector)}</div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-burgundy/10 bg-light-grey px-4 py-3 text-sm text-burgundy/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] dark:border-white/10 dark:bg-[#211430]/60 dark:text-white/80">
                    <div className="text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60">
                      Requests recorded
                    </div>
                    <div className="font-mono text-xs">{frame.requests.length}</div>
                  </div>
                </div>
              ))}
            </div>
          </section> */}

          <section className="mt-14">
            <div className="rounded-3xl border border-burgundy/10 bg-white/95 p-6 shadow-[0_32px_80px_-55px_rgba(57,31,91,0.45)] dark:border-white/10 dark:bg-[#1a0f27]/95 dark:shadow-[0_36px_90px_-55px_rgba(0,0,0,0.65)]">
              <h2 className="text-2xl font-semibold text-burgundy dark:text-white">Consensus gossip</h2>
              <div className="mt-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.seqno}
                    className="rounded-2xl border border-burgundy/10 bg-white px-4 py-4 text-sm text-burgundy shadow-[0_20px_55px_-45px_rgba(64,0,27,0.5)] dark:border-white/10 dark:bg-[#211430] dark:text-white"
                  >
                    <div className="text-xs font-semibold uppercase tracking-[0.3em] text-burgundy/60 dark:text-white/60">
                      {formatTimestamp(message.timestamp)}
                    </div>
                    <div className="mt-1 font-mono text-xs text-burgundy/70 dark:text-white/70">
                      from {message.from} · seqno {message.seqno}
                    </div>
                    <div className="mt-2 font-mono text-xs text-burgundy dark:text-white break-all">
                      {message.data}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
