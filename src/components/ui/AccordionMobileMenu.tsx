

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { cn } from "@/components/helpers";
import ChevronDown from "@/components/ui/ChevronDown";

// Inject styles locally for mobile
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
  <AccordionPrimitive.Item ref={ref} className={cn(className)} {...props} />
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
        "flex flex-1 gap-6 text-left items-center justify-between text-2xl font-medium cursor-pointer group",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className="size-4 transition-transform [&_path]:transition-colors group-data-[state=open]:rotate-180 group-[&[data-state=open]]:rotate-180" />
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
        "overflow-hidden text-base text-light-grey/80 transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down",
        className
      )}
      {...props}
    >
      <div className={cn("pt-4", className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
});
AccordionContent.displayName = "AccordionContent";

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
