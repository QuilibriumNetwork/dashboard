import type { ProductionClass } from "./api";

export type Tone = "default" | "safe" | "warn" | "risk";

export const toneBadgeClasses: Record<Tone, string> = {
  default: "bg-light-grey text-secondary dark:bg-surface-subtle",
  safe: "bg-green/10 text-green dark:bg-green/20 dark:text-light-green",
  warn: "bg-warning-subtle text-warning",
  risk: "bg-danger-subtle text-danger",
};

export const productionClassMeta: Record<ProductionClass, { label: string; description: string; tone: Tone }> = {
  producing: {
    label: "Producing",
    description: "GLOBAL applied at least one of the shard's app frames in the window.",
    tone: "safe",
  },
  staffed_not_producing: {
    label: "Staffed, not producing",
    description:
      "Enough active provers, but no app frame was applied in the window. This can be a handoff, activation or sync phase, not necessarily a stall.",
    tone: "warn",
  },
  below_quorum: {
    label: "Below quorum",
    description: "Fewer effectively active provers than a certificate needs.",
    tone: "risk",
  },
  no_data: {
    label: "No data",
    description:
      "The window is not fully indexed or holds a missing frame, or the shard's headers have unknown outcomes and none applied.",
    tone: "default",
  },
};
