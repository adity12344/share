import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'srm' | 'retro-amber' | 'retro-pine';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'md', loading, children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-semibold tracking-wide font-sans transition-[transform,box-shadow,background-color,border-color,color] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-stone-900 dark:focus-visible:ring-stone-100 disabled:pointer-events-none disabled:opacity-50 select-none rounded-lg cursor-pointer active:translate-x-[1px] active:translate-y-[1px] active:scale-[0.97]';

    const variants = {
      default: 'bg-emerald-700 hover:bg-emerald-800 text-white border-2 border-stone-900 dark:border-stone-700 shadow-[2.5px_2.5px_0px_0px_#1e1c1a] dark:shadow-[2.5px_2.5px_0px_0px_#000000] hover:shadow-[3.5px_3.5px_0px_0px_#1e1c1a] hover:-translate-y-0.5 active:translate-y-[1px] active:shadow-none',
      'retro-pine': 'bg-emerald-700 hover:bg-emerald-800 text-white border-2 border-stone-900 dark:border-stone-700 shadow-[2.5px_2.5px_0px_0px_#1e1c1a] dark:shadow-[2.5px_2.5px_0px_0px_#000000] hover:shadow-[3.5px_3.5px_0px_0px_#1e1c1a] hover:-translate-y-0.5 active:translate-y-[1px] active:shadow-none',
      'retro-amber': 'bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold border-2 border-stone-900 dark:border-stone-700 shadow-[2.5px_2.5px_0px_0px_#1e1c1a] dark:shadow-[2.5px_2.5px_0px_0px_#000000] hover:shadow-[3.5px_3.5px_0px_0px_#1e1c1a] hover:-translate-y-0.5 active:translate-y-[1px] active:shadow-none',
      srm: 'bg-blue-600 hover:bg-blue-700 text-white border-2 border-stone-900 dark:border-stone-700 shadow-[2.5px_2.5px_0px_0px_#1e1c1a] dark:shadow-[2.5px_2.5px_0px_0px_#000000] hover:shadow-[3.5px_3.5px_0px_0px_#1e1c1a] hover:-translate-y-0.5 active:translate-y-[1px] active:shadow-none',
      secondary: 'bg-[#faf6ee] dark:bg-stone-800 text-stone-900 dark:text-stone-100 border-2 border-stone-900 dark:border-stone-700 shadow-[2.5px_2.5px_0px_0px_#1e1c1a] dark:shadow-[2.5px_2.5px_0px_0px_#000000] hover:bg-stone-100 dark:hover:bg-stone-700/80 hover:shadow-[3.5px_3.5px_0px_0px_#1e1c1a] hover:-translate-y-0.5 active:translate-y-[1px] active:shadow-none',
      outline: 'bg-transparent border-2 border-stone-900 dark:border-stone-600 text-stone-900 dark:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800/80 shadow-[2px_2px_0px_0px_#1e1c1a] dark:shadow-[2px_2px_0px_0px_#000000] hover:shadow-[3px_3px_0px_0px_#1e1c1a] hover:-translate-y-0.5 active:translate-y-[1px] active:shadow-none',
      ghost: 'bg-transparent text-stone-700 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white hover:bg-stone-200/50 dark:hover:bg-stone-800/60 border border-transparent hover:-translate-y-0.5 active:translate-y-[1px]',
      destructive: 'bg-rose-600 hover:bg-rose-700 text-white border-2 border-stone-900 dark:border-stone-700 shadow-[2.5px_2.5px_0px_0px_#1e1c1a] dark:shadow-[2.5px_2.5px_0px_0px_#000000] hover:shadow-[3.5px_3.5px_0px_0px_#1e1c1a] hover:-translate-y-0.5 active:translate-y-[1px] active:shadow-none',
    };

    const sizes = {
      sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
      md: 'h-10 px-4 text-sm gap-2 rounded-lg',
      lg: 'h-11 px-6 text-base gap-2.5 rounded-xl',
      icon: 'h-10 w-10 p-0 rounded-lg',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {loading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1.5" />
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
