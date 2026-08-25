import React from 'react';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <div
    className={`rounded-xl border-2 border-stone-900 dark:border-stone-700 bg-white dark:bg-[#1c1a18] text-stone-900 dark:text-stone-100 shadow-[3px_3px_0px_0px_#1e1c1a] dark:shadow-[3px_3px_0px_0px_#000000] transition-all duration-200 ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <div className={`flex flex-col space-y-1.5 p-5 ${className}`} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <h3 className={`text-xl font-bold font-sans tracking-tight text-stone-950 dark:text-stone-100 ${className}`} {...props}>
    {children}
  </h3>
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <p className={`text-sm text-stone-600 dark:text-stone-400 leading-relaxed font-sans ${className}`} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <div className={`p-5 pt-0 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className = '',
  children,
  ...props
}) => (
  <div className={`flex items-center p-5 pt-3 border-t-2 border-stone-200 dark:border-stone-800 mt-4 ${className}`} {...props}>
    {children}
  </div>
);

