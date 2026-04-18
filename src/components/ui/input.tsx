// Thin wrapper around Radix TextField for text/password inputs.
import React from "react";
import { TextField } from "@radix-ui/themes";
import type { ComponentProps } from "react";

export const Input = React.forwardRef<
  HTMLInputElement,
  ComponentProps<typeof TextField.Root>
>((props, ref) => <TextField.Root ref={ref} size="2" {...props} />);

Input.displayName = "Input";
