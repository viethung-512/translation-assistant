import { useT } from "@/v2/tokens/tokens";
import { Typography } from "@/v2/components/ui/typography";

export function RecordingStatus({
  label,
  dotColor,
  isActive,
}: {
  label: string;
  dotColor: string;
  isActive: boolean;
}) {
  const t = useT();

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        background: t.card,
        borderRadius: 999,
        padding: "7px 14px",
        marginTop: 12,
        border: `1px solid ${t.divider}`,
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: dotColor,
          boxShadow: isActive ? `0 0 0 4px ${dotColor}33` : "none",
        }}
      />
      <Typography variant="action">{label}</Typography>
    </div>
  );
}
