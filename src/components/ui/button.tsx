// Thin wrapper around Radix Button mapping old variant/size names to Radix props.
import React from "react";
import { Button as RadixButton } from "@radix-ui/themes";
import type { ComponentProps } from "react";

type OldVariant = "primary" | "danger" | "ghost" | "outline";
type OldSize = "sm" | "md";

interface ButtonProps extends Omit<
  ComponentProps<typeof RadixButton>,
  "variant" | "size"
> {
  variant?: OldVariant;
  size?: OldSize;
}

function mapVariantColor(variant: OldVariant): {
  variant: ComponentProps<typeof RadixButton>["variant"];
  color?: ComponentProps<typeof RadixButton>["color"];
} {
  switch (variant) {
    case "primary":
      return { variant: "solid" };
    case "danger":
      return { variant: "solid", color: "red" };
    case "ghost":
      return { variant: "ghost" };
    case "outline":
      return { variant: "outline" };
  }
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", color: colorProp, ...rest }, ref) => {
    const { variant: radixVariant, color: derivedColor } =
      mapVariantColor(variant);
    const radixSize: ComponentProps<typeof RadixButton>["size"] =
      size === "sm" ? "1" : "2";
    return (
      <RadixButton
        ref={ref}
        variant={radixVariant}
        color={colorProp ?? derivedColor}
        size={radixSize}
        {...rest}
      />
    );
  },
);

Button.displayName = "Button";
