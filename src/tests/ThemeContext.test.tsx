import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ThemeProvider, useTheme } from '../context/ThemeContext';

// Helper component to interact with context in tests
const TestComponent: React.FC = () => {
  const { theme, toggleTheme, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
      <button data-testid="toggle-btn" onClick={toggleTheme}>Toggle</button>
      <button data-testid="set-light-btn" onClick={() => setTheme('light')}>Set Light</button>
      <button data-testid="set-dark-btn" onClick={() => setTheme('dark')}>Set Dark</button>
    </div>
  );
};

describe('ThemeContext', () => {
  beforeEach(() => {
    // Clear localStorage
    localStorage.clear();
    // Reset document element attributes
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme');
    
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(), // Deprecated
        removeListener: vi.fn(), // Deprecated
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  it('provides default light theme when localStorage and media query are empty', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-value').textContent).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });

  it('respects pre-stored localStorage values', () => {
    localStorage.setItem('theme', 'dark');

    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    expect(screen.getByTestId('theme-value').textContent).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('toggles theme correctly', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const toggleBtn = screen.getByTestId('toggle-btn');
    
    // Initial light
    expect(screen.getByTestId('theme-value').textContent).toBe('light');
    
    // Toggle to dark
    act(() => {
      toggleBtn.click();
    });
    expect(screen.getByTestId('theme-value').textContent).toBe('dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(localStorage.getItem('theme')).toBe('dark');

    // Toggle back to light
    act(() => {
      toggleBtn.click();
    });
    expect(screen.getByTestId('theme-value').textContent).toBe('light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(localStorage.getItem('theme')).toBe('light');
  });

  it('sets exact theme values directly', () => {
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>
    );

    const setDarkBtn = screen.getByTestId('set-dark-btn');
    const setLightBtn = screen.getByTestId('set-light-btn');

    // Set dark
    act(() => {
      setDarkBtn.click();
    });
    expect(screen.getByTestId('theme-value').textContent).toBe('dark');

    // Set light
    act(() => {
      setLightBtn.click();
    });
    expect(screen.getByTestId('theme-value').textContent).toBe('light');
  });
});
