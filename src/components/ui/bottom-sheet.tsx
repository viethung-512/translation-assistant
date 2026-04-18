// iOS-style bottom sheet using Radix Dialog — provides overlay, focus trap, Escape dismiss.
import { Dialog, Flex } from "@radix-ui/themes";
import type { ReactNode } from "react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function BottomSheet({ isOpen, onClose, children }: BottomSheetProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Content
        aria-describedby={undefined}
        className="glass"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          top: "auto",
          margin: "0 auto",
          maxWidth: 500,
          width: "100%",
          /* Rounded top corners only — flat at bottom edge of screen */
          borderRadius: "28px 28px 0 0",
          borderBottom: "none",
          paddingBottom: "max(28px, env(safe-area-inset-bottom))",
          transform: "none",
        }}
      >
        {/* Drag handle pill */}
        <Flex justify="center" pt="3" pb="1">
          <span
            style={{
              width: 40,
              height: 4,
              borderRadius: "var(--radius-full)",
              background: "var(--gray-6)",
              display: "block",
              opacity: 0.5,
            }}
          />
        </Flex>
        {/* Visually-hidden title to satisfy Radix Dialog accessibility requirement */}
        <Dialog.Title style={{ display: "none" }}>Panel</Dialog.Title>
        {children}
      </Dialog.Content>
    </Dialog.Root>
  );
}
