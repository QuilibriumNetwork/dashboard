// Theme toggle injection script for built application
(function() {
  'use strict';

  // Initialize theme from localStorage or system preference
  function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const root = document.documentElement;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }

  // Toggle theme function
  function toggleTheme() {
    const root = document.documentElement;
    const isDark = root.classList.contains('dark');

    if (isDark) {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }

    // Update button icon
    updateToggleButton(!isDark);
  }

  // Create toggle button HTML
  function createToggleButton(isDark) {
    const sunIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
    `;

    const moonIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    `;

    const button = document.createElement('button');
    button.className = 'flex items-center justify-center w-8 h-8 rounded-lg border border-burgundy/20 dark:border-white/20 bg-white dark:bg-[#1a0f27] text-burgundy dark:text-white transition-colors hover:bg-light-grey/30 dark:hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-burgundy/30 dark:focus:ring-white/30';
    button.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    button.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    button.innerHTML = isDark ? sunIcon : moonIcon;
    button.addEventListener('click', toggleTheme);

    return button;
  }

  // Update toggle button icon
  function updateToggleButton(isDark) {
    const button = document.getElementById('theme-toggle-button');
    if (!button) return;

    const sunIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      </svg>
    `;

    const moonIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      </svg>
    `;

    button.innerHTML = isDark ? sunIcon : moonIcon;
    button.setAttribute('aria-label', isDark ? 'Switch to light mode' : 'Switch to dark mode');
    button.setAttribute('title', isDark ? 'Switch to light mode' : 'Switch to dark mode');
  }

  // Inject toggle button into header
  function injectToggleButton() {
    // Wait for React to render the header
    const checkInterval = setInterval(() => {
      // Look for the Status link or Operational badge
      const statusLink = document.querySelector('a[href="https://status.quilibrium.com"]');
      const headerRight = statusLink?.parentElement;

      if (headerRight && !document.getElementById('theme-toggle-button')) {
        const isDark = document.documentElement.classList.contains('dark');
        const toggleButton = createToggleButton(isDark);
        toggleButton.id = 'theme-toggle-button';

        // Insert before the Status link
        headerRight.insertBefore(toggleButton, statusLink);

        clearInterval(checkInterval);
      }
    }, 100);

    // Stop checking after 5 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 5000);
  }

  // Initialize theme on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initTheme();
      injectToggleButton();
    });
  } else {
    initTheme();
    injectToggleButton();
  }

  // Also try after a short delay to catch React-rendered content
  setTimeout(() => {
    injectToggleButton();
  }, 500);
})();



