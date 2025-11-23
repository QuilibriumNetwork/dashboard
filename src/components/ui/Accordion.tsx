

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { cn } from "@/components/helpers";

// Inject styles locally for desktop
function injectAccordionStyles() {
  if (document.getElementById("accordion-animation-styles")) return;

  const style = document.createElement("style");
  style.id = "accordion-animation-styles";
  style.innerHTML = `
    @keyframes accordion-down {
      from { height: 0; }
      to { height: var(--radix-accordion-content-height); }
    }
    @keyframes accordion-up {
      from { height: var(--radix-accordion-content-height); }
      to { height: 0; }
    }
    .animate-accordion-down {
      animation: accordion-down 0.3s var(--default-transition-timing-function);
    }
    .animate-accordion-up {
      animation: accordion-up 0.3s var(--default-transition-timing-function);
    }
  `;
  document.head.appendChild(style);
}

const Accordion = AccordionPrimitive.Root;

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    className={cn("border-b-[1px] border-white/20", className)}
    {...props}
  />
));
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <AccordionPrimitive.Header className="flex">
    <AccordionPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex flex-1 gap-6 text-left items-center justify-between pt-[20px] pb-[15px] lg:py-6 text-[20px] leading-6 text-light-grey cursor-pointer transition-colors hover:text-pink group",
        className
      )}
      {...props}
    >
      {children}
      <div className="relative size-6 flex-none mr-3">
        <span className="absolute w-full h-[1px] bg-light-grey left-1/2 top-1/2 -translate-1/2 group-hover:bg-pink"></span>
        <span className="absolute w-full h-[1px] bg-light-grey left-1/2 top-1/2 -translate-1/2 transition-all group-hover:bg-pink rotate-90 group-[&[data-state=open]]:rotate-0"></span>
      </div>
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
));
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  React.useEffect(() => {
    injectAccordionStyles();
  }, []);

  return (
    <AccordionPrimitive.Content
      ref={ref}
      className={cn(
        "overflow-hidden text-base text-white/80 transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
        className
      )}
      {...props}
    >
      <div className={cn("pb-[20px] lg:pb-6 pt-0", className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
});
AccordionContent.displayName = "AccordionContent";

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
