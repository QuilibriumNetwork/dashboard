import { useState, type ReactNode } from "react";
import ChevronDown from "@/components/ui/ChevronDown";

interface CollapsiblePanelProps {
  label: string;
  children: ReactNode;
  /** Controlled mode: external expanded state */
  expanded?: boolean;
  /** Controlled mode: toggle callback */
  onToggle?: () => void;
  /** Uncontrolled mode: initial state (default false) */
  defaultExpanded?: boolean;
}

export function CollapsiblePanel({
  label,
  children,
  expanded: controlledExpanded,
  onToggle,
  defaultExpanded = false,
}: CollapsiblePanelProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);

  const isControlled = controlledExpanded !== undefined;
  const isExpanded = isControlled ? controlledExpanded : internalExpanded;

  const handleToggle = () => {
    if (isControlled) {
      onToggle?.();
    } else {
      setInternalExpanded((prev) => !prev);
    }
  };

  return (
    <div className="rounded-2xl border border-default bg-surface-raised overflow-hidden">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-6 py-4 text-left transition-colors hover:bg-light-grey/30 dark:hover:bg-white/5"
      >
        <span className="text-sm font-semibold uppercase tracking-label text-secondary">
          {label}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted transition-transform ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>

      {isExpanded && (
        <div className="border-t border-subtle">{children}</div>
      )}
    </div>
  );
}
