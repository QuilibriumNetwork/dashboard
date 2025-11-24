export function SimpleFooter() {
  return (
    <footer className="mt-20 bg-burgundy py-12 text-white dark:bg-[#0f0715]">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="text-lg font-bold">Quilibrium Explorer</h3>
            <p className="mt-3 text-white/70 dark:text-white/60">
              Live health monitoring for the Quilibrium network, applications, and
              ecosystem services.
            </p>
          </div>

          <div>
          </div>

          <div>
            <h4 className="font-semibold">Connect</h4>
            <ul className="mt-4 space-y-2 text-white/70 dark:text-white/60">
              <li>
                <a
                  href="https://quilibrium.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-white"
                >
                  Quilibrium.com
                </a>
              </li>
              <li>
                <a
                  href="https://docs.quilibrium.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-white"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="https://discord.gg/quilibrium"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-white"
                >
                  Discord community
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t border-white/20 pt-8 text-center text-white/60 dark:border-white/10 dark:text-white/40">
          <p>&copy; 2025 Quilibrium. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
