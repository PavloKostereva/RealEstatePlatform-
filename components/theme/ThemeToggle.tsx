'use client';

import { useTheme } from './ThemeProvider';

function SunIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2" />
      <path d="M12 20v2" />
      <path d="m4.93 4.93 1.41 1.41" />
      <path d="m17.66 17.66 1.41 1.41" />
      <path d="M2 12h2" />
      <path d="M20 12h2" />
      <path d="m6.34 17.66-1.41 1.41" />
      <path d="m19.07 4.93-1.41 1.41" />
    </svg>
  );
}

function MoonStarsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-5 h-5">
      <path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79Z" />
      <circle cx="18" cy="6" r="1" fill="currentColor" />
      <circle cx="20" cy="10" r="0.5" fill="currentColor" />
    </svg>
  );
}

export function ThemeToggle() {
  const { theme, toggleTheme, isLoaded } = useTheme();

  if (!isLoaded) {
    return null;
  }

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      className="relative flex h-10 w-20 items-center rounded-full bg-surface-secondary border border-subtle transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
      {/* Sun icon (left side) */}
      <div className="absolute left-2 z-0 text-foreground">
        <SunIcon />
      </div>

      {/* Moon and stars icon (right side) */}
      <div className="absolute right-2 z-0 text-foreground">
        <MoonStarsIcon />
      </div>

      {/* Active indicator (white circle) - moves between icons */}
      <div
        className={`absolute top-1 bottom-1 w-9 rounded-full bg-white shadow-md transition-all duration-300 z-10 ${
          isDark ? 'left-1' : 'left-10'
        }`}
      />
    </button>
  );
}
