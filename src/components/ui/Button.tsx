import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/components/helpers";

const base =
  "inline-flex items-center justify-center font-semibold transition-all duration-300 ease-[var(--default-transition-timing-function)] focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed";

const buttonVariants = cva(base, {
  variants: {
    variant: {
      primary:
        "bg-pink text-light-grey border-2 border-pink hover:bg-transparent hover:text-pink",

      secondary:
        "uppercase tracking-label text-secondary hover:text-primary border border-default hover:bg-active-highlight",

      burgundy:
        "bg-burgundy text-white border-2 border-burgundy hover:bg-transparent hover:text-burgundy",

      ghost:
        "uppercase tracking-label bg-transparent text-secondary hover:text-primary border-0",

      white:
        "bg-white text-burgundy border-2 border-white hover:bg-transparent hover:text-white",

      "dark-grey":
        "bg-dark-grey text-burgundy border-2 border-dark-grey hover:bg-transparent hover:text-dark-grey",

      beige:
        "bg-beige text-burgundy border-2 border-beige hover:bg-transparent hover:text-beige",

      warning:
        "bg-warning-subtle text-warning border-2 border-warning/20 hover:bg-warning hover:text-white hover:border-warning",

      danger:
        "bg-danger-subtle text-danger border-2 border-danger/20 hover:bg-danger hover:text-white hover:border-danger",

      success:
        "bg-light-green text-green border-2 border-light-green hover:bg-transparent hover:text-green hover:border-green",

      "outline-primary":
        "border-2 border-pink text-pink bg-transparent hover:bg-pink hover:text-white",

      "outline-burgundy":
        "border-2 border-burgundy text-burgundy bg-transparent hover:bg-burgundy hover:text-white",

      "outline-white":
        "border-2 border-white text-white bg-transparent hover:bg-white hover:text-burgundy",

      "outline-dark-grey":
        "border-2 border-dark-grey text-dark-grey bg-transparent hover:bg-dark-grey hover:text-burgundy",

      "outline-beige":
        "border-2 border-beige text-beige bg-transparent hover:bg-beige hover:text-burgundy",
    },

    size: {
      default: "px-6 py-[10px] text-base leading-[32px] rounded-[12px]",
      small: "px-4 py-2 text-sm",
      large: "px-8 py-5 text-lg",
      xs: "px-3 py-1.5 text-sm sm:text-xs",
      icon: "p-2.5",
    },

    rounded: {
      default: "rounded-lg",
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-lg",
      xl: "rounded-xl",
      full: "rounded-full",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "default",
    rounded: "default",
  },
});

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, rounded, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, rounded }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
