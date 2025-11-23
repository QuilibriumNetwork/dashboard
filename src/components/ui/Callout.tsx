import React from "react";
import { icon } from "@/assets/icons";

type CalloutType = "info" | "success" | "warning" | "error" | "beige";
type CalloutSize = "default" | "big";

const iconMap = {
  info: icon.informationcircle,
  success: icon.check,
  warning: icon.warningshield,
  error: icon.bug,
  beige: icon.pin1,
};

const styleMap: Record<CalloutType, string> = {
  info: "bg-light-blue text-blue",
  success: "bg-light-green text-green",
  warning: "bg-light-orange text-orange",
  error: "bg-[#ffe0e0] text-[#b00020]",
  beige: "bg-beige text-burgundy",
};

const sizeMap: Record<CalloutSize, string> = {
  default: "text-sm",
  big: "text-base",
};

export default function Callout({
  type = "info",
  size = "default",
  children,
}: {
  type?: CalloutType;
  size?: CalloutSize;
  children: React.ReactNode;
}) {
  const Icon = iconMap[type];
  const styles = styleMap[type];
  const sizeClass = sizeMap[size];

  return (
    <div
      className={`flex items-start gap-4 p-4 rounded-md my-4 ${styles} ${sizeClass}`}
    >
      {Icon && (
        <div className="flex-shrink-0 w-5 h-5 mt-0.5">
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div className="flex-1 text-left break-words">{children}</div>
    </div>
  );
}
