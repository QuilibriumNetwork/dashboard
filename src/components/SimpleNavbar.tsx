import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HeaderSearch } from "@/components/HeaderSearch";

export function SimpleNavbar() {
  const location = useLocation();
  const isAnalyticsActive = location.pathname === "/frames-analytics";
  const isPeersActive = location.pathname === "/peers" || location.pathname.startsWith("/peers/");
  const isFavoritesActive = location.pathname === "/peer-favorites";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLinkClick = () => {
    setMobileMenuOpen(false);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-subtle bg-surface backdrop-blur">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3 flex-shrink-0">
            <Link to="/" className="flex items-center transition-opacity hover:opacity-70">
              <span className="text-xl font-bold text-primary">
                <span className="hidden sm:inline">Quilibrium Dashboard</span>
                <span className="sm:hidden">Q Dashboard</span>
              </span>
            </Link>
            {/* Full badge at lg+, dot-only below lg */}
            <span className="hidden lg:inline-flex items-center gap-2 rounded-full border border-green/20 bg-light-green/70 px-4 py-1 text-xs font-semibold uppercase tracking-label text-green shadow-status dark:border-green/30 dark:bg-green/15 dark:text-green">
              <span className="relative inline-flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green/70 opacity-75 dark:bg-green/60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green" />
              </span>
              Operational
            </span>
            <span className="lg:hidden relative inline-flex h-4 w-4 items-center justify-center rounded-full border border-green/20 bg-light-green/70 dark:border-green/30 dark:bg-green/15">
              <span className="absolute inline-flex h-2 w-2 animate-ping rounded-full bg-green/70 opacity-75 dark:bg-green/60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green" />
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden nav:flex items-center gap-5 flex-1 justify-end min-w-0">
            <HeaderSearch />
            <Link
              to="/peers"
              className={`group relative flex items-center py-1 text-sm font-semibold transition-colors ${
                isPeersActive
                  ? "text-pink"
                  : "text-burgundy hover:text-pink dark:text-white dark:hover:text-pink"
              }`}
            >
              Peers
              <span
                className={`absolute bottom-0 left-0 h-0.5 transition-all duration-300 ease-out ${
                  isPeersActive ? "w-full bg-pink" : "w-0 group-hover:w-full bg-pink"
                }`}
              />
            </Link>
            <Link
              to="/peer-favorites"
              className={`group relative flex items-center py-1 text-sm font-semibold transition-colors ${
                isFavoritesActive
                  ? "text-pink"
                  : "text-burgundy hover:text-pink dark:text-white dark:hover:text-pink"
              }`}
            >
              Favorites
              <span
                className={`absolute bottom-0 left-0 h-0.5 transition-all duration-300 ease-out ${
                  isFavoritesActive ? "w-full bg-pink" : "w-0 group-hover:w-full bg-pink"
                }`}
              />
            </Link>
            <Link
              to="/frames-analytics"
              className={`group relative flex items-center py-1 text-sm font-semibold transition-colors ${
                isAnalyticsActive
                  ? "text-pink"
                  : "text-burgundy hover:text-pink dark:text-white dark:hover:text-pink"
              }`}
            >
              Frame Analytics
              <span
                className={`absolute bottom-0 left-0 h-0.5 transition-all duration-300 ease-out ${
                  isAnalyticsActive ? "w-full bg-pink" : "w-0 group-hover:w-full bg-pink"
                }`}
              />
            </Link>
            <a
              href="https://status.quilibrium.com"
              className="group relative flex items-center py-1 text-sm font-semibold text-burgundy transition-colors hover:text-pink dark:text-white dark:hover:text-pink"
            >
              Status
              <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-pink transition-all duration-300 ease-out group-hover:w-full" />
            </a>
            <ThemeToggle />
          </div>

          {/* Tablet/Mobile: Search + Hamburger */}
          <div className="nav:hidden flex items-center gap-3">
            {/* Search visible until xs breakpoint */}
            <div className="hidden xs:block w-48 sm:w-64 flex-shrink-0">
              <HeaderSearch fullWidth />
            </div>
            <button
              className="p-2.5"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              <div className="w-6 h-5 relative flex flex-col justify-between">
                <span
                  className={`block h-0.5 w-full bg-[rgb(var(--color-text-primary))] transition-all duration-300 origin-center ${
                    mobileMenuOpen ? "rotate-45 translate-y-[9px]" : ""
                  }`}
                />
                <span
                  className={`block h-0.5 w-full bg-[rgb(var(--color-text-primary))] transition-all duration-300 ${
                    mobileMenuOpen ? "opacity-0" : ""
                  }`}
                />
                <span
                  className={`block h-0.5 w-full bg-[rgb(var(--color-text-primary))] transition-all duration-300 origin-center ${
                    mobileMenuOpen ? "-rotate-45 -translate-y-[9px]" : ""
                  }`}
                />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile menu — slides down inside the navbar */}
        <div
          className={`nav:hidden overflow-hidden transition-all duration-300 ease-out ${
            mobileMenuOpen ? "max-h-[600px]" : "max-h-0"
          }`}
        >
          <div className="py-4">
            <div className="flex flex-col space-y-1 font-semibold">
              {/* Search — only in menu below xs breakpoint */}
              <div
                className={`w-full mb-2 xs:hidden transition-all duration-300 ease-out ${
                  mobileMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                }`}
                style={{ transitionDelay: mobileMenuOpen ? "50ms" : "0ms" }}
              >
                <HeaderSearch fullWidth={true} />
              </div>

              {/* Navigation Links */}
              <Link
                to="/peers"
                onClick={handleLinkClick}
                className={`flex items-center py-3 px-2 rounded-lg transition-all duration-300 ease-out ${
                  mobileMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                } ${
                  isPeersActive
                    ? "text-pink bg-pink/5"
                    : "text-primary hover:text-pink hover:bg-pink/5"
                }`}
                style={{ transitionDelay: mobileMenuOpen ? "100ms" : "0ms" }}
              >
                Peers
              </Link>
              <Link
                to="/peer-favorites"
                onClick={handleLinkClick}
                className={`flex items-center py-3 px-2 rounded-lg transition-all duration-300 ease-out ${
                  mobileMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                } ${
                  isFavoritesActive
                    ? "text-pink bg-pink/5"
                    : "text-primary hover:text-pink hover:bg-pink/5"
                }`}
                style={{ transitionDelay: mobileMenuOpen ? "150ms" : "0ms" }}
              >
                Favorites
              </Link>
              <Link
                to="/frames-analytics"
                onClick={handleLinkClick}
                className={`flex items-center py-3 px-2 rounded-lg transition-all duration-300 ease-out ${
                  mobileMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                } ${
                  isAnalyticsActive
                    ? "text-pink bg-pink/5"
                    : "text-primary hover:text-pink hover:bg-pink/5"
                }`}
                style={{ transitionDelay: mobileMenuOpen ? "200ms" : "0ms" }}
              >
                Frame Analytics
              </Link>
              <a
                href="https://status.quilibrium.com"
                onClick={handleLinkClick}
                className={`flex items-center py-3 px-2 rounded-lg transition-all duration-300 ease-out text-primary hover:text-pink hover:bg-pink/5 ${
                  mobileMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                }`}
                style={{ transitionDelay: mobileMenuOpen ? "250ms" : "0ms" }}
              >
                Status
              </a>

              {/* Theme Toggle */}
              <div
                className={`pt-3 mt-4 border-t border-subtle transition-all duration-300 ease-out ${
                  mobileMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                }`}
                style={{ transitionDelay: mobileMenuOpen ? "300ms" : "0ms" }}
              >
                <div className="-ml-1">
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
