import { Helmet } from "react-helmet-async";
import { ReactNode } from "react";

interface PageLayoutProps {
  title: string;
  children: ReactNode;
}

export function PageLayout({ title, children }: PageLayoutProps) {
  return (
    <div className="relative min-h-screen pb-24 pt-16">
      <Helmet>
        <title>{title}</title>
      </Helmet>

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        {/* Light blobs */}
        <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-light-purple/80 blur-3xl dark:hidden" />
        <div className="absolute -right-10 bottom-24 h-72 w-72 rounded-full bg-light-blue/80 blur-3xl dark:hidden" />
        <div className="absolute left-1/3 top-[240px] h-80 w-80 -translate-x-1/2 rounded-full bg-light-green blur-[120px] dark:hidden" />
        {/* Dark blobs */}
        <div className="absolute -left-24 top-10 h-64 w-64 rounded-full blur-3xl hidden dark:block bg-[rgba(120,60,200,0.30)]" />
        <div className="absolute -right-32 top-[300px] h-96 w-96 rounded-full blur-[140px] hidden dark:block bg-[rgba(255,96,0,0.25)]" />
        <div className="absolute left-1/3 top-[240px] h-80 w-80 -translate-x-1/2 rounded-full blur-[120px] hidden dark:block bg-[rgba(255,5,109,0.20)]" />
      </div>

      {children}
    </div>
  );
}
