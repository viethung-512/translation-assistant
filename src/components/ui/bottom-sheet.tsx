// iOS-style bottom sheet using Radix Dialog — provides focus trap, Escape dismiss.
import { Dialog, Flex } from "@radix-ui/themes";
import type { ReactNode } from "react";

interface BottomSheetProps {
  isOpen: boolean;
  onDismiss: () => void;
  children: ReactNode;
}

export function BottomSheet({ isOpen, onDismiss, children }: BottomSheetProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onDismiss()}>
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
          borderRadius: "28px 28px 0 0",
          borderBottom: "none",
          paddingBottom: "28px",
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
