import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/components/helpers";

const base =
  "inline-flex items-center justify-center text-base font-semibold rounded-[12px] px-6 py-[10px] leading-[32px] transition-colors duration-300 ease-[var(--default-transition-timing-function)]";

const buttonVariants = cva(base, {
  variants: {
    variant: {
      primary:
        "bg-pink text-light-grey border-2 border-pink hover:bg-transparent hover:text-pink transition-all duration-300 ease-[var(--default-transition-timing-function)]",

      secondary:
        "bg-white/30 text-light-grey border-2 border-transparent hover:bg-transparent hover:text-white hover:border-white/30 transition-all duration-300 ease-[var(--default-transition-timing-function)]",

      burgundy:
        "bg-burgundy text-white border-2 border-burgundy hover:bg-transparent hover:text-burgundy transition-all duration-300 ease-[var(--default-transition-timing-function)]",

      white:
        "bg-white text-burgundy border-2 border-white hover:bg-transparent hover:text-white transition-all duration-300 ease-[var(--default-transition-timing-function)]",

      "dark-grey":
        "bg-dark-grey text-burgundy border-2 border-dark-grey hover:bg-transparent hover:text-dark-grey transition-all duration-300 ease-[var(--default-transition-timing-function)]",

      beige:
        "bg-beige text-burgundy border-2 border-beige hover:bg-transparent hover:text-beige transition-all duration-300 ease-[var(--default-transition-timing-function)]",

      warning:
        "bg-[#F6E2B3] text-[#B67900] border-2 border-[#F6E2B3] hover:bg-transparent hover:text-[#B67900] hover:border-[#B67900] transition-all duration-300 ease-[var(--default-transition-timing-function)]",

      danger:
        "bg-red-100 text-red-600 border-2 border-red-100 hover:bg-transparent hover:text-red-600 hover:border-red-600 transition-all duration-300 ease-[var(--default-transition-timing-function)]",

      success:
        "bg-light-green text-green border-2 border-light-green hover:bg-transparent hover:text-green hover:border-green transition-all duration-300 ease-[var(--default-transition-timing-function)]",

      "outline-primary":
        "border-2 border-pink text-pink bg-transparent hover:bg-pink hover:text-white transition-all duration-300 ease-[var(--default-transition-timing-function)]",

      "outline-burgundy":
        "border-2 border-burgundy text-burgundy bg-transparent hover:bg-burgundy hover:text-white transition-all duration-300 ease-[var(--default-transition-timing-function)]",

      "outline-white":
        "border-2 border-white text-white bg-transparent hover:bg-white hover:text-burgundy transition-colors duration-300 ease-[var(--default-transition-timing-function)]",

      "outline-dark-grey":
        "border-2 border-dark-grey text-dark-grey bg-transparent hover:bg-dark-grey hover:text-burgundy transition-colors duration-300 ease-[var(--default-transition-timing-function)]",

      "outline-beige":
        "border-2 border-beige text-beige bg-transparent hover:bg-beige hover:text-burgundy transition-colors duration-300 ease-[var(--default-transition-timing-function)]",
    },

    size: {
      default: "",
      small: "px-4 py-2 text-sm rounded-md",
      large: "px-8 py-5 text-lg",
      xs: "px-3 py-1 text-xs rounded",
    },
  },
  defaultVariants: {
    variant: "primary",
    size: "default",
  },
});

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
