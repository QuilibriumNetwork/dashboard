import * as React from "react"
import * as NavigationMenuPrimitive from "@radix-ui/react-navigation-menu"
import { cva } from "class-variance-authority"

import { cn } from "@/components/helpers";
import { Link } from "react-router-dom";

const NavigationMenu = React.forwardRef<
    React.ElementRef<typeof NavigationMenuPrimitive.Root>,
    React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Root>
>(({ className, children, ...props }, ref) => (
    <NavigationMenuPrimitive.Root
        ref={ref}
        className={cn(
            "relative z-10 flex items-center justify-center",
            className
        )}
        {...props}
    >
        {children}
    </NavigationMenuPrimitive.Root>
))
NavigationMenu.displayName = NavigationMenuPrimitive.Root.displayName

const NavigationMenuList = React.forwardRef<
    React.ElementRef<typeof NavigationMenuPrimitive.List>,
    React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.List>
>(({ className, ...props }, ref) => (
    <NavigationMenuPrimitive.List
        ref={ref}
        className={cn(
            "group flex flex-1 items-center justify-center",
            className
        )}
        {...props}
    />
))
NavigationMenuList.displayName = NavigationMenuPrimitive.List.displayName

const NavigationMenuItem = NavigationMenuPrimitive.Item

const navigationMenuTriggerStyle = cva(
    "group inline-flex items-center gap-2 py-2 px-[20px] leading-6 font-semibold text-light-grey cursor-pointer relative hover:text-light-grey/80 active:text-light-grey/80 hover:[&_path]:stroke-light-grey/80 active:[&_path]:stroke-light-grey/80"
)

const NavigationMenuTrigger = React.forwardRef<
    React.ElementRef<typeof NavigationMenuPrimitive.Trigger>,
    React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
    <NavigationMenuPrimitive.Trigger
        ref={ref}
        className={cn(navigationMenuTriggerStyle(), "group", className)}
        {...props}
    >
        {children}
    </NavigationMenuPrimitive.Trigger>
))
NavigationMenuTrigger.displayName = NavigationMenuPrimitive.Trigger.displayName

const NavigationMenuContent = React.forwardRef<
    React.ElementRef<typeof NavigationMenuPrimitive.Content>,
    React.ComponentPropsWithoutRef<typeof NavigationMenuPrimitive.Content>
>(({ className, ...props }, ref) => (
    <NavigationMenuPrimitive.Content
        ref={ref}
        className={cn(
            "left-0 top-full py-4 px-[20px] absolute bg-light-grey rounded-[6px] shadow-[0_12px_32px_rgba(0,0,0,0.12)] min-w-52",
            className
        )}
        {...props}
    />
))
NavigationMenuContent.displayName = NavigationMenuPrimitive.Content.displayName

const NavigationMenuLink = NavigationMenuPrimitive.Link

export {
    navigationMenuTriggerStyle,
    NavigationMenu,
    NavigationMenuList,
    NavigationMenuItem,
    NavigationMenuContent,
    NavigationMenuTrigger,
    NavigationMenuLink,
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & { href: string }
>(({ className, children, href = "/", ...props }, ref) => {
  const isExternal = href.startsWith("http");

  return (
    <li>
      <NavigationMenuLink asChild>
        {isExternal ? (
          <a
            ref={ref}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "text-base text-burgundy font-medium pt-1 pb-2 inline-flex transition-colors hover:text-pink active:text-pink",
              className
            )}
            {...props}
          >
            {children}
          </a>
        ) : (
          <Link
            ref={ref}
            to={href}
            className={cn(
              "text-base text-burgundy font-medium pt-1 pb-2 inline-flex transition-colors hover:text-pink active:text-pink",
              className
            )}
            {...props}
          >
            {children}
          </Link>
        )}
      </NavigationMenuLink>
    </li>
  );
});

ListItem.displayName = "ListItem"

export {
    ListItem
}