// Radix Select wrapper adapting native onChange(event) → Radix onValueChange(string).
import { Select as RadixSelect } from "@radix-ui/themes";
import type { ReactNode } from "react";

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}

export function Select({ value, onChange, children }: SelectProps) {
  return (
    <RadixSelect.Root value={value} onValueChange={onChange}>
      <RadixSelect.Trigger style={{ width: "100%" }} />
      <RadixSelect.Content>{children}</RadixSelect.Content>
    </RadixSelect.Root>
  );
}

// Re-export Select.Item so callers can use <SelectItem> directly
export const SelectItem = RadixSelect.Item;
