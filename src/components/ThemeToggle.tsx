import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  showLabel = false,
  size = 'md',
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`inline-flex items-center justify-center gap-2 rounded-xl transition-all duration-200 cursor-pointer border select-none ${
        size === 'sm' ? 'p-1.5 text-xs' : 'p-2 text-sm'
      } ${
        isDark
          ? 'bg-stone-900 border-stone-700 text-stone-200 hover:bg-stone-800 hover:text-white hover:border-stone-600 focus:ring-emerald-400'
          : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100 hover:text-stone-900 hover:border-stone-300 focus:ring-emerald-500'
      } focus:outline-none focus:ring-2 focus:ring-offset-1 ${className}`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode (currently ${theme})`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 hover:rotate-90" />
      ) : (
        <Moon className="w-4 h-4 text-stone-600 transition-transform duration-300 hover:-rotate-12" />
      )}
      {showLabel && (
        <span className="font-medium text-xs">
          {isDark ? 'Light Theme' : 'Dark Theme'}
        </span>
      )}
    </button>
  );
};
