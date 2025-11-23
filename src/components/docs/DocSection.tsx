// components/docs/DocSection.tsx

import React from "react";
import { CopyButton } from "./CopyButton";

interface DocSectionProps {
  title: string;
  id?: string;
  description?: React.ReactNode;
  code?: string;
  children?: React.ReactNode;
}

export function DocSection({
  title,
  id,
  description,
  code,
  children,
}: DocSectionProps) {
  const sectionId = id || title.toLowerCase().replace(/\s+/g, "-");

  return (
    <section className="mb-12">
      <h2 id={sectionId} data-toc="true">
        {title}
      </h2>

      {description && (
        <div className="prose prose-sm max-w-none text-burgundy mb-4">
          {description}
        </div>
      )}

      {children && <div className="mb-4">{children}</div>}

      {code && (
        <div className="relative group mt-4">
          <div className="code-block">
            <pre className="overflow-x-auto max-h-32 whitespace-pre-wrap">
              <code className="block">{code}</code>
            </pre>
          </div>
          <CopyButton text={code} />
        </div>
      )}

      <div className="h-px bg-beige mt-6" />
    </section>
  );
}
