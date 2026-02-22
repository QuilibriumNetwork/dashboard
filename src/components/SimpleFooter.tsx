import { useState, useEffect } from "react";
import Icon from "@/components/ui/Icons";
import { Button } from "@/components/ui/Button";

export function SimpleFooter() {
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <footer className="relative text-white py-12 overflow-hidden bg-gradient-to-br from-[#251542] via-[#1a1024] to-[#1a1024]">
      {/* Decorative radial gradients */}
      <div className="absolute top-0 left-0 w-[350px] h-[350px] bg-purple/25 rounded-full blur-[100px]" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-pink/25 rounded-full blur-[80px]" />
      <div className="absolute top-0 right-1/4 w-[200px] h-[200px] bg-pink/20 rounded-full blur-[60px]" />
      <div className="absolute bottom-1/3 left-1/3 w-[250px] h-[150px] bg-purple/15 rounded-full blur-[90px]" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Back to Top - inline in footer on small screens */}
        <div className="flex justify-center mb-8 md:hidden">
          <Button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            variant="outline-white"
            size="icon"
            rounded="full"
            aria-label="Scroll to top"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg md:text-xl font-semibold text-white/80 mb-4">
              Quilibrium Explorer
            </h3>
            <p className="text-white/60">
              Live health monitoring for the Quilibrium network, applications, and
              ecosystem services.
            </p>
          </div>

          <div></div>

          <div>
            <h4 className="text-base font-semibold text-white/80 mb-4">Quick Links</h4>
            <ul className="space-y-2 text-white/60">
              <li>
                <a
                  href="https://quilibrium.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <Icon name="qsymbol" className="w-4 h-4" />
                  Quilibrium Main Site
                </a>
              </li>
              <li>
                <a
                  href="https://docs.quilibrium.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <Icon name="graduationcap" className="w-4 h-4" />
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://discord.gg/quilibrium"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-white transition-colors"
                >
                  <Icon name="discord" className="w-4 h-4" />
                  Discord Community
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 mt-8 pt-8 text-center text-white/50">
          <p>&copy; 2025 Quilibrium. All rights reserved.</p>
        </div>
      </div>

      {/* Back to Top - fixed button on large screens */}
      {showBackToTop && (
        <Button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          variant="secondary"
          size="icon"
          rounded="full"
          className="hidden md:flex fixed bottom-6 right-6 z-50 shadow-lg hover:shadow-xl bg-surface-raised/90 backdrop-blur-sm"
          aria-label="Scroll to top"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.5}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </Button>
      )}
    </footer>
  );
}
