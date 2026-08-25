import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategoryFilter } from '../components/CategoryFilter';

describe('CategoryFilter', () => {
  const mockItemCounts = {
    All: 15,
    Textbooks: 5,
    Electronics: 3,
    Services: 2,
    Opportunities: 1,
    'Dorm Essentials': 4,
  };

  it('renders all category options including "All Categories"', () => {
    const handleSelect = vi.fn();
    render(
      <CategoryFilter
        selectedCategory="All"
        onSelectCategory={handleSelect}
        itemCounts={mockItemCounts}
      />
    );

    // Should display All Categories and categories from CATEGORIES
    expect(screen.getByText('All Categories')).toBeDefined();
    expect(screen.getByText('Textbooks')).toBeDefined();
    expect(screen.getByText('Electronics')).toBeDefined();
    expect(screen.getByText('Services')).toBeDefined();
    expect(screen.getByText('Opportunities')).toBeDefined();
    expect(screen.getByText('Dorm Essentials')).toBeDefined();
  });

  it('displays the correct item count badges', () => {
    const handleSelect = vi.fn();
    render(
      <CategoryFilter
        selectedCategory="All"
        onSelectCategory={handleSelect}
        itemCounts={mockItemCounts}
      />
    );

    expect(screen.getByText('15')).toBeDefined();
    expect(screen.getByText('5')).toBeDefined();
    expect(screen.getByText('3')).toBeDefined();
  });

  it('triggers onSelectCategory callback when a filter chip is clicked', () => {
    const handleSelect = vi.fn();
    render(
      <CategoryFilter
        selectedCategory="All"
        onSelectCategory={handleSelect}
        itemCounts={mockItemCounts}
      />
    );

    const textbookButton = screen.getByText('Textbooks').closest('button');
    expect(textbookButton).toBeDefined();
    if (textbookButton) {
      fireEvent.click(textbookButton);
    }

    expect(handleSelect).toHaveBeenCalledWith('Textbooks');
  });

  it('applies selected styles to the currently active category filter chip', () => {
    const handleSelect = vi.fn();
    const { container } = render(
      <CategoryFilter
        selectedCategory="Electronics"
        onSelectCategory={handleSelect}
        itemCounts={mockItemCounts}
      />
    );

    const electronicsButton = screen.getByText('Electronics').closest('button');
    const textbookButton = screen.getByText('Textbooks').closest('button');

    const electronicsClasses = electronicsButton?.className.split(/\s+/) || [];
    const textbookClasses = textbookButton?.className.split(/\s+/) || [];

    // Selected button (Electronics) should have bg-stone-900 class
    expect(electronicsClasses).toContain('bg-stone-900');
    // Unselected button (Textbooks) should have bg-white class and not bg-stone-900
    expect(textbookClasses).toContain('bg-white');
    expect(textbookClasses).not.toContain('bg-stone-900');
  });
});
