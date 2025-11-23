import Icon from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";
import clsx from "clsx";

export type PageIntroProps = {
  title: string;
  subtitle?: string;
  icon?: string;
  iconClassName?: string;
  button?: {
    label: string;
    href: string;
    external?: boolean;
  };
  variant?: "light" | "dark";
  className?: string;
};

export function PageIntro({
  title,
  subtitle,
  icon,
  iconClassName = "",
  button,
  variant = "light",
  className = "",
}: PageIntroProps) {
  const isLight = variant === "light";

  const sizeMap = {
    heading: "text-5xl sm:text-6xl",
    icon: "w-auto h-12 lg:h-14",
  };

  const { heading, icon: iconSize } = sizeMap;

  return (
    <section
      className={clsx(
        "w-full pt-40 pb-32 text-center",
        isLight
          ? "bg-beige-white-2 text-burgundy"
          : "bg-burgundy-pink-3 text-light-grey",
        className
      )}
    >
      <div className="container">
        <div className="flex flex-col items-center gap-6 max-w-3xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 text-center sm:text-left mx-auto">
            {icon && (
              <Icon
                name={icon}
                className={clsx(
                  iconSize,
                  iconClassName,
                  "shrink-0 block align-middle",
                  isLight ? "text-pink" : "text-beige"
                )}
              />
            )}
            <h1
              className={clsx(
                "mb-0 pb-1",
                heading,
                isLight ? "gradient-sweep" : "gradient-sweep--dark"
              )}
            >
              {title}
            </h1>
          </div>
          {subtitle && (
            <p className="text-lg sm:text-xl max-w-2xl">{subtitle}</p>
          )}
          {button && (
            <div className="mt-4">
              <Button
                asChild
                variant={isLight ? "outline-primary" : "primary"}
                className="text-base"
              >
                {button.external ? (
                  <a
                    href={button.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {button.label}
                  </a>
                ) : (
                  <a href={button.href}>{button.label}</a>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
