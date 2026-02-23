import Icon from "@/components/ui/Icons";
import { cn } from "@/components/helpers/classnames";

interface SectionTitleProps {
  icon: string;
  children: React.ReactNode;
  className?: string;
}

export function SectionTitle({ icon, children, className }: SectionTitleProps) {
  return (
    <h2
      className={cn(
        "flex items-center gap-4 md:gap-5 text-lg md:text-3xl font-semibold uppercase tracking-label text-primary",
        className
      )}
    >
      <Icon
        name={icon}
        className="shrink-0 text-primary opacity-70"
        style={{
          width: "0.9em",
          height: "0.9em",
        }}
      />
      <span>{children}</span>
    </h2>
  );
}
