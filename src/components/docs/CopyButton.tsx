// components/docs/CopyButton.tsx

import { useState } from "react";

interface CopyButtonProps {
  text: string;
}

export function CopyButton({ text }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={`absolute top-2 right-12 px-2 py-1 text-xs rounded transition-colors
    ${
      copied
        ? "bg-light-green text-green"
        : "bg-gray-200 text-burgundy hover:bg-light-orange"
    }`}
    >
      {copied ? "Copied" : "Copy"}
    </button>
  );
}
