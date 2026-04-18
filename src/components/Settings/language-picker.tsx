import { useMemo } from "react";
import { Box, Text } from "@radix-ui/themes";
import { Select, SelectItem } from "@/components/ui";
import { ALL_AVAILABLE_LANGUAGES } from "@/constants/languages";

interface Props {
  label: string;
  value: string;
  onChange: (code: string) => void;
  exclude?: string;
}

export function LanguagePicker({ label, value, onChange, exclude }: Props) {
  const options = useMemo(
    () => ALL_AVAILABLE_LANGUAGES.filter((l) => l.code !== exclude),
    [exclude],
  );

  return (
    <Box mb="3">
      <Text as="label" size="1" color="gray" weight="medium" mb="1" style={{ display: "block" }}>
        {label}
      </Text>
      <Select value={value} onChange={onChange}>
        {options.map((l) => (
          <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>
        ))}
      </Select>
    </Box>
  );
}
