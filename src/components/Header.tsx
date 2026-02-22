import { Link } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  return (
    <nav className="sticky top-0 z-50 border-b border-subtle bg-surface backdrop-blur">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <div className="flex flex-col">
              <span className="text-xl font-bold text-primary">
                Quilibrium Dashboard
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-5">
            <span className="hidden items-center gap-2 rounded-full border border-green/20 bg-light-green/70 px-4 py-1 text-xs font-semibold uppercase tracking-label text-green shadow-status md:inline-flex dark:border-green/30 dark:bg-green/15 dark:text-green">
              <span className="relative inline-flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green/70 opacity-75 dark:bg-green/60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green" />
              </span>
              Operational
            </span>
            <ThemeToggle />
            <a
              href="https://status.quilibrium.com"
              className="text-sm font-semibold text-burgundy transition-colors hover:text-purple dark:text-white dark:hover:text-light-blue"
            >
              Status
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
