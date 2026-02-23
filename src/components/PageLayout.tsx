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

      {children}
    </div>
  );
}
