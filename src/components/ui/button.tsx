// Reusable button variants aligned with the design-system token set.
// Variants: primary (accent), danger, ghost (text-only), outline.
import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'danger' | 'ghost' | 'outline';
type Size    = 'sm' | 'md';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-accent text-white border-transparent hover:opacity-90 active:opacity-80',
  danger:  'bg-danger text-white border-transparent hover:opacity-90 active:opacity-80',
  ghost:   'bg-transparent text-text-secondary border-transparent hover:bg-bg-tertiary active:bg-bg-tertiary',
  outline: 'bg-bg-secondary text-text-secondary border-border hover:bg-bg-tertiary active:bg-bg-tertiary',
};

const sizeClasses: Record<Size, string> = {
  sm: 'text-[11px] px-[10px] py-[3px] min-h-[28px] rounded-[20px]',
  md: 'text-[13px] px-4 py-2 min-h-touch rounded-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled}
      className={[
        'inline-flex items-center justify-center border cursor-pointer',
        'transition-opacity duration-150 select-none',
        'disabled:opacity-40 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </button>
  );
}
