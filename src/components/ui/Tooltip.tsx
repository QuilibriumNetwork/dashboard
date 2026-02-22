import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/components/helpers";

const TooltipProvider = TooltipPrimitive.Provider;
const TooltipRoot = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;
const TooltipPortal = TooltipPrimitive.Portal;

const TooltipContent = React.forwardRef<
  React.ComponentRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, children, ...props }, ref) => (
  <TooltipPortal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        "z-50 rounded px-2 py-1 text-sm sm:text-xs text-[var(--color-text-tooltip)] bg-tooltip shadow-lg",
        "select-none",
        className,
      )}
      {...props}
    >
      {children}
      <TooltipPrimitive.Arrow className="fill-[var(--color-bg-tooltip)]" />
    </TooltipPrimitive.Content>
  </TooltipPortal>
));
TooltipContent.displayName = "TooltipContent";

/**
 * Simple Tooltip wrapper for the most common case: hover a trigger, show text.
 */
function Tooltip({
  children,
  content,
  side,
  align,
  className,
  delayDuration = 300,
  open,
  onOpenChange,
  asChild = true,
}: {
  children: React.ReactNode;
  content: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  className?: string;
  delayDuration?: number;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  asChild?: boolean;
}) {
  return (
    <TooltipRoot delayDuration={delayDuration} open={open} onOpenChange={onOpenChange}>
      <TooltipTrigger asChild={asChild}>{children}</TooltipTrigger>
      <TooltipContent side={side} align={align} className={className}>
        {content}
      </TooltipContent>
    </TooltipRoot>
  );
}

export {
  Tooltip,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
  TooltipContent,
};
