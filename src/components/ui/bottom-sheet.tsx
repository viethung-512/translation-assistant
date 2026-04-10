// iOS-style bottom sheet with overlay backdrop.
// Animates in/out with the iOS spring curve defined in the design system.
import type { ReactNode } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function BottomSheet({ isOpen, onClose, children }: BottomSheetProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={[
          'fixed inset-0 z-[100]',
          'transition-[background] duration-250',
          isOpen ? 'bg-overlay pointer-events-auto' : 'bg-transparent pointer-events-none',
        ].join(' ')}
      />

      {/* Sheet */}
      <div
        role="dialog"
        aria-modal="true"
        className={[
          'fixed bottom-0 left-0 right-0 z-[101]',
          'max-w-[500px] mx-auto',
          'bg-bg-primary rounded-t-2xl shadow-md',
          'transition-transform duration-[280ms] ease-[cubic-bezier(0.32,0.72,0,1)]',
          '[padding-bottom:calc(28px+env(safe-area-inset-bottom,0px))]',
          isOpen ? 'translate-y-0' : 'translate-y-full',
        ].join(' ')}
      >
        {/* Drag handle pill */}
        <div className="flex justify-center pt-3 pb-1">
          <span className="w-9 h-1 rounded-full bg-bg-tertiary" />
        </div>
        {children}
      </div>
    </>
  );
}
