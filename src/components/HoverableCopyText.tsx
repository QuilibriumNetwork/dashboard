import { useState } from "react";

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
    <span
      className="relative inline-flex items-center group cursor-pointer"
      onClick={handleCopy}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className={`group-hover:underline transition-colors ${copied ? 'text-green dark:text-light-green' : ''}`}>
        {children}
      </span>
      {hovered && (
        <span className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 font-inter text-sm sm:text-xs tracking-normal rounded shadow-lg whitespace-nowrap pointer-events-none z-50 ${copied ? 'bg-green text-white' : 'bg-tooltip text-[var(--color-text-tooltip)]'}`}>
          {copied ? 'Copied!' : 'Click to copy'}
          <span className={`absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent ${copied ? 'border-t-green' : 'border-t-[var(--color-bg-tooltip)]'}`} />
        </span>
      )}
    </span>
  );
}
