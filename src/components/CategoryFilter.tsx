import React from 'react';
import { CategoryType, CATEGORIES } from '../types';
import {
  BookOpen,
  Cpu,
  Wrench,
  Compass,
  Home,
  LayoutGrid,
} from 'lucide-react';

interface CategoryFilterProps {
  selectedCategory: CategoryType | 'All';
  onSelectCategory: (category: CategoryType | 'All') => void;
  itemCounts?: Record<string, number>;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  selectedCategory,
  onSelectCategory,
  itemCounts,
}) => {
  const getCategoryIcon = (cat: CategoryType | 'All') => {
    switch (cat) {
      case 'Textbooks':
        return <BookOpen className="w-4 h-4" />;
      case 'Electronics':
        return <Cpu className="w-4 h-4" />;
      case 'Services':
        return <Wrench className="w-4 h-4" />;
      case 'Opportunities':
        return <Compass className="w-4 h-4" />;
      case 'Dorm Essentials':
        return <Home className="w-4 h-4" />;
      case 'All':
      default:
        return <LayoutGrid className="w-4 h-4" />;
    }
  };

  const allCategories: (CategoryType | 'All')[] = ['All', ...CATEGORIES];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      {allCategories.map((cat) => {
        const isSelected = selectedCategory === cat;
        const count = itemCounts ? itemCounts[cat] : undefined;

        return (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={`group inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-[transform,box-shadow,background-color,color] duration-150 cursor-pointer select-none shrink-0 hover:scale-[1.03] hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 dark:focus-visible:ring-stone-100 ${
              isSelected
                ? 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 shadow-retro-sm ring-1 ring-stone-900 dark:ring-stone-100'
                : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 hover:text-stone-900 dark:hover:text-white border border-stone-200 dark:border-stone-800 shadow-2xs hover:shadow-retro-sm'
            }`}
          >
            <span
              className={`transition-transform duration-150 group-hover:rotate-6 ${
                isSelected ? 'text-emerald-400 dark:text-emerald-600' : 'text-stone-500 dark:text-stone-400 group-hover:text-amber-500'
              }`}
            >
              {getCategoryIcon(cat)}
            </span>
            <span>{cat === 'All' ? 'All Categories' : cat}</span>
            {count !== undefined && (
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold transition-colors ${
                  isSelected
                    ? 'bg-stone-800 dark:bg-stone-200 text-stone-300 dark:text-stone-800'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
