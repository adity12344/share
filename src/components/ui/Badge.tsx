import React from 'react';
import { CategoryType } from '../../types';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'default'
    | 'verified'
    | 'unverified'
    | 'category'
    | 'outline'
    | 'price'
    | 'status-open'
    | 'status-completed'
    | 'deal-great'
    | 'deal-fair'
    | 'deal-overpriced';
  category?: CategoryType;
}

export const Badge: React.FC<BadgeProps> = ({
  className = '',
  variant = 'default',
  category,
  children,
  ...props
}) => {
  const baseStyle = 'inline-flex items-center gap-1 font-bold font-sans transition-all rounded-md px-2 py-0.5 text-[11px] uppercase tracking-wider whitespace-nowrap shadow-[1.5px_1.5px_0px_0px_rgba(30,28,26,0.35)] dark:shadow-[1.5px_1.5px_0px_0px_rgba(0,0,0,0.6)]';

  const categoryStyles: Record<CategoryType, string> = {
    'Textbooks': 'bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border-2 border-stone-800 dark:border-amber-700',
    'Electronics': 'bg-sky-100 dark:bg-sky-950/80 text-sky-900 dark:text-sky-200 border-2 border-stone-800 dark:border-sky-700',
    'Services': 'bg-purple-100 dark:bg-purple-950/80 text-purple-900 dark:text-purple-200 border-2 border-stone-800 dark:border-purple-700',
    'Opportunities': 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border-2 border-stone-800 dark:border-emerald-700',
    'Dorm Essentials': 'bg-rose-100 dark:bg-rose-950/80 text-rose-900 dark:text-rose-200 border-2 border-stone-800 dark:border-rose-700',
  };

  const variants = {
    default: 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 border-2 border-stone-800 dark:border-stone-600',
    verified: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-900 dark:text-emerald-200 border-2 border-stone-800 dark:border-emerald-700 font-bold',
    unverified: 'bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-2 border-stone-800 dark:border-stone-600',
    category: category ? categoryStyles[category] : 'bg-stone-100 dark:bg-stone-800 text-stone-900 dark:text-stone-100 border-2 border-stone-800 dark:border-stone-600',
    outline: 'border-2 border-stone-900 dark:border-stone-600 text-stone-900 dark:text-stone-100 bg-white dark:bg-stone-800',
    price: 'bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-extrabold tracking-tight border-2 border-stone-900 dark:border-stone-100 font-bebas text-base px-2.5',
    'status-open': 'bg-emerald-200 dark:bg-emerald-950/80 text-emerald-950 dark:text-emerald-200 border-2 border-stone-800 dark:border-emerald-700',
    'status-completed': 'bg-stone-300 dark:bg-stone-800 text-stone-700 dark:text-stone-400 border-2 border-stone-800 dark:border-stone-700 line-through opacity-75',
    'deal-great': 'bg-emerald-200 dark:bg-emerald-950/90 text-emerald-950 dark:text-emerald-200 border-2 border-stone-900 dark:border-emerald-700 font-extrabold',
    'deal-fair': 'bg-amber-200 dark:bg-amber-950/90 text-amber-950 dark:text-amber-200 border-2 border-stone-900 dark:border-amber-700 font-extrabold',
    'deal-overpriced': 'bg-rose-200 dark:bg-rose-950/90 text-rose-950 dark:text-rose-200 border-2 border-stone-900 dark:border-rose-700 font-extrabold',
  };

  return (
    <span className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {children}
    </span>
  );
};

