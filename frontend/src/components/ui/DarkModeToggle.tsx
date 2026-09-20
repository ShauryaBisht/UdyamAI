'use client';

import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '@/stores/themeStore';

interface DarkModeToggleProps {
  showLabel?: boolean;
  className?: string;
}

export default function DarkModeToggle({ showLabel = false, className = '' }: DarkModeToggleProps) {
  const { theme, toggleTheme, hydrated } = useThemeStore();

  const isDark = hydrated ? theme === 'dark' : false;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`group relative inline-flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 ${
        showLabel
          ? 'gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-foreground-muted hover:bg-neutral-100 dark:hover:bg-neutral-800 hover:text-foreground w-full'
          : 'h-10 w-10 rounded-full bg-[#F6F7F9] dark:bg-[#1E242D] border border-[#EAEAEA] dark:border-[#2B313C] text-foreground-muted hover:text-foreground hover:bg-neutral-100 dark:hover:bg-[#252C37] shadow-sm hover:shadow'
      } ${className}`}
    >
      <div className="relative flex items-center justify-center transition-transform duration-300 group-hover:rotate-12">
        {isDark ? (
          <Sun className="h-4.5 w-4.5 text-amber-400 transition-all duration-300 animate-fade-in" />
        ) : (
          <Moon className="h-4.5 w-4.5 text-slate-700 dark:text-slate-300 transition-all duration-300 animate-fade-in" />
        )}
      </div>
      {showLabel && (
        <span className="truncate">
          {isDark ? 'Light Theme' : 'Dark Theme'}
        </span>
      )}
    </button>
  );
}
