// components/docs/LayoutWithToc.tsx

import { useEffect, useState } from "react";

interface LayoutWithTocProps {
  children: React.ReactNode;
}

export function LayoutWithToc({ children }: LayoutWithTocProps) {
  const [headings, setHeadings] = useState<{ id: string; text: string }[]>([]);
  const [activeId, setActiveId] = useState<string>(() =>
    window.location.hash.slice(1)
  );

  // Extract and ID h2 elements only from inside this layout
  useEffect(() => {
    const container = document.getElementById("toc-scope");
    if (!container) return;

    const elements = Array.from(
      container.querySelectorAll("h2[data-toc='true']")
    ).map((el) => {
      if (!el.id) {
        el.id = el.textContent?.toLowerCase().replace(/\s+/g, "-") || "";
      }
      return { id: el.id, text: el.textContent || "" };
    });

    setHeadings(elements);
  }, [children]);

  // Update active item when URL hash changes
  useEffect(() => {
    const handleHashChange = () => {
      setActiveId(window.location.hash.slice(1));
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  return (
    <div
      id="toc-scope"
      className="container grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-10"
    >
      <div>{children}</div>
      <nav className="hidden lg:block sticky top-28 self-start">
        <ul className="space-y-1">
          {headings.map(({ id, text }) => (
            <li key={id}>
              <a
                href={`#${id}`}
                className={`block px-3 py-1 rounded text-burgundy/70 hover:bg-burgundy/10 hover:text-burgundy ${
                  activeId === id ? "!text-pink font-semibold" : ""
                }`}
              >
                {text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
