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
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center flex-shrink-0">
            <span className="text-xl font-bold text-primary">
              Quilibrium Dashboard
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden nav:flex items-center gap-5">
            <HeaderSearch />
            <span className="items-center gap-2 rounded-full border border-green/20 bg-light-green/70 px-4 py-1 text-xs font-semibold uppercase tracking-label text-green shadow-status inline-flex dark:border-green/30 dark:bg-green/15 dark:text-green">
              <span className="relative inline-flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green/70 opacity-75 dark:bg-green/60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green" />
              </span>
              Operational
            </span>
            <Link
              to="/peers"
              className={`group relative flex items-center py-1 text-sm font-semibold transition-colors ${
                isPeersActive
                  ? "text-purple dark:text-light-blue"
                  : "text-burgundy hover:text-pink dark:text-white dark:hover:text-pink"
              }`}
            >
              Peers
              <span
                className={`absolute bottom-0 left-0 h-0.5 transition-all duration-300 ease-out ${
                  isPeersActive ? "w-full bg-purple dark:bg-light-blue" : "w-0 group-hover:w-full bg-pink"
                }`}
              />
            </Link>
            <Link
              to="/peer-favorites"
              className={`group relative flex items-center py-1 text-sm font-semibold transition-colors ${
                isFavoritesActive
                  ? "text-purple dark:text-light-blue"
                  : "text-burgundy hover:text-pink dark:text-white dark:hover:text-pink"
              }`}
            >
              Favorites
              <span
                className={`absolute bottom-0 left-0 h-0.5 transition-all duration-300 ease-out ${
                  isFavoritesActive ? "w-full bg-purple dark:bg-light-blue" : "w-0 group-hover:w-full bg-pink"
                }`}
              />
            </Link>
            <Link
              to="/frames-analytics"
              className={`group relative flex items-center py-1 text-sm font-semibold transition-colors ${
                isAnalyticsActive
                  ? "text-purple dark:text-light-blue"
                  : "text-burgundy hover:text-pink dark:text-white dark:hover:text-pink"
              }`}
            >
              Frame Analytics
              <span
                className={`absolute bottom-0 left-0 h-0.5 transition-all duration-300 ease-out ${
                  isAnalyticsActive ? "w-full bg-purple dark:bg-light-blue" : "w-0 group-hover:w-full bg-pink"
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

          {/* Mobile: Animated Hamburger Button */}
          <button
            className="nav:hidden p-2.5"
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

        {/* Mobile menu — slides down inside the navbar */}
        <div
          className={`nav:hidden overflow-hidden transition-all duration-300 ease-out ${
            mobileMenuOpen ? "max-h-[600px]" : "max-h-0"
          }`}
        >
          <div className="py-4">
            <div className="flex flex-col space-y-1 font-semibold">
              {/* Status Badge */}
              <div
                className={`flex items-center gap-2 rounded-full border border-green/20 bg-light-green/70 px-4 py-2 text-xs font-semibold uppercase tracking-label text-green shadow-status w-fit mb-3 dark:border-green/30 dark:bg-green/15 dark:text-green transition-all duration-300 ease-out ${
                  mobileMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                }`}
                style={{ transitionDelay: mobileMenuOpen ? "50ms" : "0ms" }}
              >
                <span className="relative inline-flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green/70 opacity-75 dark:bg-green/60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green" />
                </span>
                Operational
              </div>

              {/* Search */}
              <div
                className={`w-full mb-2 transition-all duration-300 ease-out ${
                  mobileMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                }`}
                style={{ transitionDelay: mobileMenuOpen ? "100ms" : "0ms" }}
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
                    ? "text-purple dark:text-light-blue bg-purple/5 dark:bg-light-blue/5"
                    : "text-primary hover:text-pink hover:bg-pink/5"
                }`}
                style={{ transitionDelay: mobileMenuOpen ? "150ms" : "0ms" }}
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
                    ? "text-purple dark:text-light-blue bg-purple/5 dark:bg-light-blue/5"
                    : "text-primary hover:text-pink hover:bg-pink/5"
                }`}
                style={{ transitionDelay: mobileMenuOpen ? "200ms" : "0ms" }}
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
                    ? "text-purple dark:text-light-blue bg-purple/5 dark:bg-light-blue/5"
                    : "text-primary hover:text-pink hover:bg-pink/5"
                }`}
                style={{ transitionDelay: mobileMenuOpen ? "250ms" : "0ms" }}
              >
                Frame Analytics
              </Link>
              <a
                href="https://status.quilibrium.com"
                onClick={handleLinkClick}
                className={`flex items-center py-3 px-2 rounded-lg transition-all duration-300 ease-out text-primary hover:text-pink hover:bg-pink/5 ${
                  mobileMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                }`}
                style={{ transitionDelay: mobileMenuOpen ? "300ms" : "0ms" }}
              >
                Status
              </a>

              {/* Theme Toggle */}
              <div
                className={`pt-3 mt-2 border-t border-subtle transition-all duration-300 ease-out ${
                  mobileMenuOpen ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4"
                }`}
                style={{ transitionDelay: mobileMenuOpen ? "350ms" : "0ms" }}
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
