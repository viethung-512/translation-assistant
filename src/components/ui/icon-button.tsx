// Icon-only button. Always requires aria-label for accessibility (WCAG 2.5.5).
// Touch target is enforced at 44×44px per Apple HIG.
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  children: ReactNode;
}

export function IconButton({ className = '', children, ...rest }: IconButtonProps) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center',
        'min-w-touch min-h-touch p-2 rounded-lg',
        'bg-transparent border-none text-text-secondary',
        'cursor-pointer hover:bg-bg-tertiary active:bg-bg-tertiary',
        'transition-colors duration-150',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}
