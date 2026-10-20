import { useState } from "react";
import { Link } from "react-router-dom";
import { IconCopy, IconCopyCheck } from "@tabler/icons-react";
import { normalizeHex, truncateHex } from "@/lib/format";

/** A truncated hex value linking to `to`, with a button copying the full value. */
export function HexLink({ value, to, full = false }: { value: string; to: string; full?: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  return (
    <span className="inline-flex items-center gap-1 font-mono">
      <Link
        to={to}
        title={value}
        className={`${full ? "break-all" : "whitespace-nowrap"} underline decoration-dotted underline-offset-2 hover:text-pink transition-colors`}
        onClick={(e) => e.stopPropagation()}
      >
        {full ? value : truncateHex(value)}
      </Link>
      <button
        onClick={handleCopy}
        className="shrink-0 p-0.5 rounded text-muted hover:text-primary hover:bg-active-highlight bg-transparent"
        title={copied ? "Copied!" : "Copy to clipboard"}
        aria-label="Copy to clipboard"
      >
        {copied ? <IconCopyCheck className="w-3.5 h-3.5 text-green dark:text-light-green" /> : <IconCopy className="w-3.5 h-3.5" />}
      </button>
    </span>
  );
}

function proverPath(address: string) {
  return `/provers/${normalizeHex(address)}`;
}

function shardPath(filter: string) {
  return `/provers/shards/${normalizeHex(filter)}`;
}

export function ProverLink({ address, full }: { address: string; full?: boolean }) {
  return <HexLink value={address} to={proverPath(address)} full={full} />;
}

export function ShardLink({ filter, full }: { filter: string; full?: boolean }) {
  return <HexLink value={filter} to={shardPath(filter)} full={full} />;
}
