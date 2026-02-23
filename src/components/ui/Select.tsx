import * as SelectPrimitive from "@radix-ui/react-select";
import { cn } from "@/components/helpers/classnames";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  className?: string;
}

export function Select({ value, onValueChange, options, className }: SelectProps) {
  return (
    <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
      <SelectPrimitive.Trigger
        className={cn(
          "inline-flex items-center gap-1.5 border border-default bg-white dark:bg-overlay",
          "px-3 py-1.5 text-sm sm:text-xs font-semibold text-primary rounded-lg",
          "focus:outline-none focus:ring-2 focus:ring-brand/30 transition-colors cursor-pointer",
          "hover:border-strong",
          className
        )}
      >
        <SelectPrimitive.Value />
        <SelectPrimitive.Icon className="text-muted">
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
            <path
              d="M1 1L5 5L9 1"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>

      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          className={cn(
            "overflow-hidden rounded-lg border border-default shadow-lg",
            "bg-white dark:bg-overlay",
            "animate-in fade-in-0 zoom-in-95",
          )}
          position="popper"
          sideOffset={4}
          align="center"
        >
          <SelectPrimitive.Viewport className="p-1">
            {options.map((option) => (
              <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                className={cn(
                  "relative flex items-center px-3 py-1.5 text-sm sm:text-xs font-medium text-primary",
                  "rounded cursor-pointer select-none outline-none",
                  "data-[highlighted]:bg-pink/10 data-[highlighted]:text-pink",
                  "data-[state=checked]:font-semibold",
                  "transition-colors",
                )}
              >
                <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
