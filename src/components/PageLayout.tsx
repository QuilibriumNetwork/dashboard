import { Helmet } from "react-helmet-async";
import { ReactNode } from "react";

interface PageLayoutProps {
  title: string;
  children: ReactNode;
}

export function PageLayout({ title, children }: PageLayoutProps) {
  return (
    <div className="relative min-h-screen bg-beige pb-24 pt-16 dark:bg-[#100418]">
      <Helmet>
        <title>{title}</title>
      </Helmet>

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-16 top-10 h-72 w-72 rounded-full bg-light-purple/60 blur-3xl dark:bg-purple/40" />
        <div className="absolute -right-24 top-32 h-80 w-80 rounded-full bg-light-blue/70 blur-3xl dark:bg-blue/40" />
        <div className="absolute left-1/2 top-[420px] h-80 w-80 -translate-x-1/2 rounded-full bg-light-green/60 blur-3xl dark:bg-green/30" />
      </div>

      {children}
    </div>
  );
}

