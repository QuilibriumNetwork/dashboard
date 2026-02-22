import { useState } from "react";
import Icon from "@/components/ui/Icons";
import { Tooltip } from "@/components/ui/Tooltip";

export function HoverableCopyText({ text, children }: { text: string; children: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  return (
    <Tooltip content={copied ? 'Copied!' : 'Click to copy'} delayDuration={0}>
      <span
        className="inline-flex items-center gap-1.5 group cursor-pointer"
        onClick={handleCopy}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <span className={`group-hover:underline transition-colors ${copied ? 'text-green dark:text-light-green' : ''}`}>
          {children}
        </span>
        <Icon
          name="emptyclipboard"
          className={`w-3 h-3 text-muted flex-shrink-0 transition-opacity ${hovered ? 'opacity-100' : 'opacity-0'}`}
        />
      </span>
    </Tooltip>
  );
}
