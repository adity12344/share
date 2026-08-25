import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider } from '../context/ThemeContext';
import { ThemeToggle } from '../components/ThemeToggle';

describe('ThemeToggle', () => {
  beforeEach(() => {
    localStorage.clear();
    // mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('renders the theme toggle button', () => {
    render(
      <ThemeProvider>
        <ThemeToggle />
      </ThemeProvider>
    );

    const button = screen.getByRole('button');
    expect(button).toBeDefined();
    expect(button.getAttribute('aria-label')).toContain('Switch to dark mode');
  });

  it('displays the theme label when showLabel is enabled', () => {
    render(
      <ThemeProvider>
        <ThemeToggle showLabel={true} />
      </ThemeProvider>
    );

    expect(screen.getByText('Dark Theme')).toBeDefined();
  });

  it('toggles the theme status and changes label/aria-label when clicked', () => {
    render(
      <ThemeProvider>
        <ThemeToggle showLabel={true} />
      </ThemeProvider>
    );

    const button = screen.getByRole('button');
    
    // Initial: light theme (showing Dark Theme label to prompt change, or text of what mode is currently inactive)
    // Wait, let's look at ThemeToggle.tsx:
    // {showLabel && <span className="font-medium text-xs">{isDark ? 'Light Theme' : 'Dark Theme'}</span>}
    // So isDark ? 'Light Theme' : 'Dark Theme'
    expect(screen.getByText('Dark Theme')).toBeDefined();
    
    // Click button
    fireEvent.click(button);
    
    // Now dark theme (should display 'Light Theme' label to switch to light)
    expect(screen.getByText('Light Theme')).toBeDefined();
    expect(button.getAttribute('aria-label')).toContain('Switch to light mode');
  });
});
