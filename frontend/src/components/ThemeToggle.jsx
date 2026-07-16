// components/ThemeToggle.jsx
'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Sun, Moon, Laptop } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Cycle through themes: system -> light -> dark -> system
  const toggleTheme = () => {
    if (theme === 'system') {
      setTheme('light');
    } else if (theme === 'light') {
      setTheme('dark');
    } else {
      setTheme('system');
    }
  };

  // Get the actual theme being displayed
  const getDisplayTheme = () => {
    if (!mounted) return 'system';
    if (theme === 'system') return systemTheme || 'light';
    return theme;
  };

  // Get icon based on current theme
  const getIcon = () => {
    if (!mounted) return <Laptop className="w-5 h-5" />;
    
    if (theme === 'system') {
      return <Laptop className="w-5 h-5" />;
    } else if (theme === 'dark') {
      return <Moon className="w-5 h-5" />;
    } else {
      return <Sun className="w-5 h-5" />;
    }
  };

  // Get label for the theme
  const getLabel = () => {
    if (!mounted) return 'System';
    if (theme === 'system') return 'System';
    if (theme === 'dark') return 'Dark';
    return 'Light';
  };

  return (
    <button
      onClick={toggleTheme}
      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-secondary)] hover:bg-[var(--bg-secondary)]/80 transition-all duration-200 border border-[var(--border)]"
      aria-label="Toggle theme"
      title={`Current: ${getLabel()}`}
    >
      {getIcon()}
      <span className="text-sm font-medium text-[var(--text)] hidden sm:inline">
        {getLabel()}
      </span>
    </button>
  );
}