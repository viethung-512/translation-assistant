// Radix Badge wrapper with soft variant default for status indicators.
import React from "react";
import { Badge as RadixBadge } from "@radix-ui/themes";
import type { ComponentProps } from "react";

export const Badge = React.forwardRef<
  HTMLSpanElement,
  ComponentProps<typeof RadixBadge>
>((props, ref) => <RadixBadge ref={ref} variant="soft" {...props} />);

Badge.displayName = "Badge";
