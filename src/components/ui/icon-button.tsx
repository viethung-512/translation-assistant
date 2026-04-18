// Thin wrapper around Radix IconButton — size="4" (40px) meets Apple HIG 44pt guideline with ghost padding.
import React from "react";
import { IconButton as RadixIconButton } from "@radix-ui/themes";
import type { ComponentProps } from "react";

export const IconButton = React.forwardRef<
  HTMLButtonElement,
  ComponentProps<typeof RadixIconButton>
>((props, ref) => (
  <RadixIconButton ref={ref} size="4" variant="ghost" {...props} />
));

IconButton.displayName = "IconButton";
