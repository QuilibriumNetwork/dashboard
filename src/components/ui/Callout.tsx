import React from "react";
import { icon } from "@/assets/icons";

type CalloutType = "info" | "success" | "warning" | "error" | "beige" | "blue";
type CalloutSize = "default" | "big";
type CalloutIcon = "info" | "success" | "warning" | "error" | "beige" | "blue";
type CalloutRadius = "sm" | "md" | "lg" | "xl" | "2xl";
type CalloutPadding = "sm" | "md" | "lg";

const radiusMap: Record<CalloutRadius, string> = {
  sm: "rounded-sm",
  md: "rounded-md",
  lg: "rounded-lg",
  xl: "rounded-xl",
  "2xl": "rounded-2xl",
};

const paddingMap: Record<CalloutPadding, string> = {
  sm: "p-2",
  md: "p-3",
  lg: "p-4",
};

// Custom check circle icon to match the style of other circular icons
const CheckCircle = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12 23c6.075 0 11-4.925 11-11S18.075 1 12 1 1 5.925 1 12s4.925 11 11 11Zm4.768-13.232a1 1 0 0 0-1.536-1.283l-4.193 5.031-1.757-1.757a1 1 0 0 0-1.414 1.414l2.5 2.5a1 1 0 0 0 1.475-.065l5-6Z"
    />
  </svg>
);

const iconMap: Record<
  CalloutIcon,
  React.FC<React.SVGProps<SVGSVGElement>> | (() => JSX.Element)
> = {
  info: icon.informationcircle,
  success: CheckCircle,
  warning: icon.warningshield,
  error: icon.warningshield,
  beige: icon.pin1,
  blue: icon.informationcircle,
};

const styleMap: Record<
  CalloutType,
  { container: string; border: string; icon: string; color: string }
> = {
  info: {
    container: "bg-brand-subtle",
    border: "border-brand/20",
    icon: "text-brand/70 dark:text-brand",
    color: "text-brand",
  },
  success: {
    container: "bg-success-subtle",
    border: "border-success/30",
    icon: "text-success/70 dark:text-success",
    color: "text-success",
  },
  warning: {
    container: "bg-warning-subtle",
    border: "border-warning/30",
    icon: "text-warning/70 dark:text-warning",
    color: "text-warning",
  },
  error: {
    container: "bg-danger-subtle",
    border: "border-danger/30",
    icon: "text-danger/70 dark:text-danger",
    color: "text-danger",
  },
  beige: {
    container: "bg-surface-subtle",
    border: "border-brand/20",
    icon: "text-muted",
    color: "text-primary",
  },
  blue: {
    container: "bg-info-subtle",
    border: "border-info/30",
    icon: "text-info/70",
    color: "text-info",
  },
};

const sizeMap: Record<CalloutSize, string> = {
  default: "text-sm sm:text-xs",
  big: "text-base sm:text-sm",
};

export default function Callout({
  type = "info",
  size = "default",
  radius = "lg",
  padding = "md",
  icon: iconOverride,
  customIcon: CustomIcon,
  noIcon = false,
  noBorder = false,
  onDismiss,
  className,
  children,
}: {
  type?: CalloutType;
  size?: CalloutSize;
  radius?: CalloutRadius;
  padding?: CalloutPadding;
  icon?: CalloutIcon;
  customIcon?: React.FC<React.SVGProps<SVGSVGElement>>;
  noIcon?: boolean;
  noBorder?: boolean;
  onDismiss?: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  const Icon = CustomIcon ?? iconMap[iconOverride ?? type];
  const styles = styleMap[type];
  const sizeClass = sizeMap[size];
  const radiusClass = radiusMap[radius];
  const paddingClass = paddingMap[padding];
  const showIcon = !noIcon && Icon;
  const borderClass = noBorder ? "" : `border ${styles.border}`;

  return (
    <div
      className={`flex items-start gap-3 ${paddingClass} ${radiusClass} ${borderClass} ${styles.container} ${className ?? ""}`}
    >
      {showIcon && (
        <div
          className={`flex-shrink-0 w-4 h-5 flex items-center ${styles.icon} [&>svg]:w-4 [&>svg]:h-4`}
        >
          <Icon />
        </div>
      )}
      <div
        className={`flex-1 min-w-0 text-left break-words leading-5 ${styles.color} ${sizeClass}`}
      >
        {children}
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="flex-shrink-0 p-2.5 -m-2 text-faint hover:text-muted transition-colors"
          aria-label="Dismiss"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  );
}

export type { CalloutType };
