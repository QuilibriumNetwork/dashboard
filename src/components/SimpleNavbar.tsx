import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { HeaderSearch } from "@/components/HeaderSearch";
import HamburgerMenu from "@/assets/icons/iconset/HamburgerMenu";
import Close from "@/assets/icons/iconset/Close";

export function SimpleNavbar() {
  const location = useLocation();
  const isAnalyticsActive = location.pathname === "/frames-analytics";
  const isPeersActive = location.pathname === "/peers" || location.pathname.startsWith("/peers/");
  const isFavoritesActive = location.pathname === "/peer-favorites";
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  return (
    <>
      <nav className={`sticky top-0 border-b border-burgundy/10 bg-white/95 backdrop-blur dark:border-white/10 dark:bg-[#160c21]/90 overflow-visible ${isMobileMenuOpen ? 'z-[80]' : 'z-50'}`}>
        <div className="container mx-auto px-4 md:px-4 pr-6 md:pr-4">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link to="/" className="flex items-center space-x-3 flex-shrink-0">
              <div className="flex flex-col">
                <span className="text-xl font-bold text-burgundy dark:text-white">
                  Quilibrium Dashboard
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-5 flex-1 justify-end min-w-0">
              <HeaderSearch />
              <span className="items-center gap-2 rounded-full border border-green/20 bg-light-green/70 px-4 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-green shadow-[0_20px_40px_-28px_rgba(34,169,65,0.5)] inline-flex dark:border-green/30 dark:bg-green/15 dark:text-green">
                <span className="relative inline-flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green/70 opacity-75 dark:bg-green/60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green" />
                </span>
                Operational
              </span>
              <Link
                to="/peers"
                className={`text-sm font-semibold transition-colors ${
                  isPeersActive
                    ? "text-purple dark:text-light-blue"
                    : "text-burgundy hover:text-purple dark:text-white dark:hover:text-light-blue"
                }`}
              >
                Peers
              </Link>
              <Link
                to="/peer-favorites"
                className={`text-sm font-semibold transition-colors ${
                  isFavoritesActive
                    ? "text-purple dark:text-light-blue"
                    : "text-burgundy hover:text-purple dark:text-white dark:hover:text-light-blue"
                }`}
              >
                Favorites
              </Link>
              <Link
                to="/frames-analytics"
                className={`text-sm font-semibold transition-colors ${
                  isAnalyticsActive
                    ? "text-purple dark:text-light-blue"
                    : "text-burgundy hover:text-purple dark:text-white dark:hover:text-light-blue"
                }`}
              >
                Frame Analytics
              </Link>
              <a
                href="https://status.quilibrium.com"
                className="text-sm font-semibold text-burgundy transition-colors hover:text-purple dark:text-white dark:hover:text-light-blue"
              >
                Status
              </a>
              <ThemeToggle />
            </div>

            {/* Mobile Hamburger/Close Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden flex items-center justify-center h-10 w-10 text-burgundy dark:text-white hover:bg-burgundy/10 dark:hover:bg-white/10 rounded transition-colors relative z-[80]"
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
            >
              {isMobileMenuOpen ? (
                <Close className="h-6 w-6" />
              ) : (
                <HamburgerMenu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMobileMenuOpen && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="md:hidden fixed top-0 left-0 right-0 bottom-0 w-screen bg-black/20 dark:bg-black/40 z-[60]"
            onClick={() => setIsMobileMenuOpen(false)}
            style={{ width: '100vw', maxWidth: '100vw' }}
          />
          {/* Menu Drawer */}
          <div className="md:hidden fixed top-0 left-0 right-0 bottom-0 w-screen bg-white/95 backdrop-blur dark:bg-[#160c21]/95 z-[70] overflow-y-auto"
            style={{ width: '100vw', maxWidth: '100vw' }}
          >
            <div className="w-full px-4 pt-20 pb-6 space-y-4">
              {/* Status Badge */}
              <div className="flex items-center gap-2 rounded-full border border-green/20 bg-light-green/70 px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.35em] text-green shadow-[0_20px_40px_-28px_rgba(34,169,65,0.5)] w-fit dark:border-green/30 dark:bg-green/15 dark:text-green">
                <span className="relative inline-flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green/70 opacity-75 dark:bg-green/60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green" />
                </span>
                Operational
              </div>

              {/* Search */}
            <div className="w-full">
              <HeaderSearch fullWidth={true} />
            </div>

            {/* Navigation Links */}
            <div className="flex flex-col space-y-4">
              <Link
                to="/peers"
                className={`text-base font-semibold transition-colors py-2 ${
                  isPeersActive
                    ? "text-purple dark:text-light-blue"
                    : "text-burgundy hover:text-purple dark:text-white dark:hover:text-light-blue"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Peers
              </Link>
              <Link
                to="/peer-favorites"
                className={`text-base font-semibold transition-colors py-2 ${
                  isFavoritesActive
                    ? "text-purple dark:text-light-blue"
                    : "text-burgundy hover:text-purple dark:text-white dark:hover:text-light-blue"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Favorites
              </Link>
              <Link
                to="/frames-analytics"
                className={`text-base font-semibold transition-colors py-2 ${
                  isAnalyticsActive
                    ? "text-purple dark:text-light-blue"
                    : "text-burgundy hover:text-purple dark:text-white dark:hover:text-light-blue"
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Frame Analytics
              </Link>
              <a
                href="https://status.quilibrium.com"
                className="text-base font-semibold text-burgundy transition-colors hover:text-purple dark:text-white dark:hover:text-light-blue py-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Status
              </a>
            </div>

            {/* Theme Toggle */}
            <div className="pt-4 border-t border-burgundy/10 dark:border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-burgundy dark:text-white">Theme</span>
                <ThemeToggle />
              </div>
            </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
