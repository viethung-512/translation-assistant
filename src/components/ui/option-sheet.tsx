import { useT, VT } from "@/tokens/tokens";
import { Icon } from "@/components/icons";
import { BottomSheet } from "./bottom-sheet";
import { Typography } from "./typography";

interface OptionItem<T extends string> {
  label: string;
  value: T;
  subtitle?: string;
}

interface OptionSheetProps<T extends string> {
  isOpen: boolean;
  onDismiss: () => void;
  title: string;
  options: OptionItem<T>[];
  selected: T;
  onSelect: (value: T) => void;
}

export function OptionSheet<T extends string>({
  isOpen,
  onDismiss,
  title,
  options,
  selected,
  onSelect,
}: OptionSheetProps<T>) {
  const t = useT();
  return (
    <BottomSheet
      isOpen={isOpen}
      onDismiss={onDismiss}
      title={title}
      heightPercent={60}
    >
      <div
        style={{
          overflowY: "auto",
          padding: `0 ${t.spacing.md}px ${t.spacing.xxl}px`,
        }}
      >
        {options.map((opt) => {
          const active = opt.value === selected;
          return (
            <div
              key={opt.value}
              onClick={() => {
                onSelect(opt.value);
                onDismiss();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 12px",
                borderRadius: t.radius.md,
                background: active ? t.cyanTint : "transparent",
                cursor: "pointer",
              }}
            >
              <div style={{ flex: 1 }}>
                <Typography variant="body">{opt.label}</Typography>
                {opt.subtitle && (
                  <Typography
                    variant="action"
                    color={t.textDim}
                    style={{ marginTop: 2 }}
                  >
                    {opt.subtitle}
                  </Typography>
                )}
              </div>
              {active && <Icon.Check c={VT.cyan} s={20} />}
            </div>
          );
        })}
      </div>
    </BottomSheet>
  );
}
