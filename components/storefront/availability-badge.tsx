import { Badge, type BadgeTone } from "@/components/ui/badge";
import type { Availability } from "@/lib/storefront/availability";

const LABELS: Record<Availability, { label: string; tone: BadgeTone }> = {
  IN_STOCK: { label: "In stock", tone: "positive" },
  LOW_STOCK: { label: "Only a few left", tone: "caution" },
  OUT_OF_STOCK: { label: "Out of stock", tone: "critical" },
};

/** Shows availability only — never a stock count. */
export function AvailabilityBadge({ availability }: { availability: Availability }) {
  const { label, tone } = LABELS[availability];
  return (
    <Badge tone={tone} dot>
      {label}
    </Badge>
  );
}
