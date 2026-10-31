'use client';

export type Theme = 'dark' | 'light';

export function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  try {
    const saved = localStorage.getItem('sentiro_theme');
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
  } catch {
    // Ignore storage errors in sandbox
  }
  return 'dark'; // Sentiro defaults to dark mode
}

export function applyTheme(theme: Theme): void {
  if (typeof window === 'undefined') return;
  try {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('sentiro_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      localStorage.setItem('sentiro_theme', 'light');
    }
    // Dispatch custom event so all open components sync immediately
    window.dispatchEvent(new CustomEvent('sentiro-theme-change', { detail: { theme } }));
  } catch {
    // Ignore storage errors
  }
}

export function toggleTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const isDark = document.documentElement.classList.contains('dark');
  const nextTheme: Theme = isDark ? 'light' : 'dark';
  applyTheme(nextTheme);
  return nextTheme;
}
