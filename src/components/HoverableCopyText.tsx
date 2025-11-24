import { useState } from "react";
import Icon from "@/components/ui/Icons";

export function HoverableCopyText({ text, children }: { text: string; children: React.ReactNode }) {
  const [isHovered, setIsHovered] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
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
      className="relative inline-flex items-center gap-1.5 group cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCopy}
    >
      <span className={`group-hover:underline transition-colors ${copied ? 'text-green dark:text-light-green' : ''}`}>
        {children}
      </span>
      <Icon
        name="emptyclipboard"
        className={`w-3 h-3 text-burgundy/60 dark:text-white/60 flex-shrink-0 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}
      />
      {isHovered && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-gray-700 rounded whitespace-nowrap pointer-events-none z-50 shadow-lg">
          {copied ? 'Copied!' : 'Click to copy'}
          <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900 dark:border-t-gray-700" />
        </span>
      )}
    </span>
  );
}

