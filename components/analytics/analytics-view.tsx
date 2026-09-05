import {
  BarChart3,
  LineChart,
  PieChart,
  type LucideIcon,
} from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

interface ReportPanelProps {
  title: string;
  description: string;
  icon: LucideIcon;
  /** What this panel will plot once analytics data exists. */
  awaiting: string;
  className?: string;
}

/**
 * A reserved slot for a report. Deliberately renders no chart: analytics are
 * out of scope for this build, so the panel states what it is waiting for
 * rather than showing an invented trend line.
 */
function ReportPanel({
  title,
  description,
  icon,
  awaiting,
  className,
}: ReportPanelProps) {
  return (
    <Card className={cn("flex flex-col", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <div className="flex flex-1 items-center justify-center">
        <EmptyState icon={icon} title="No data to chart yet" description={awaiting} />
      </div>
    </Card>
  );
}

/** Structural layout for the reports that will live on this page. */
export function AnalyticsView() {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <ReportPanel
        className="xl:col-span-2"
        title="Revenue over time"
        description="Total store revenue against the share the AI agent is responsible for."
        icon={LineChart}
        awaiting="Needs order history from the store database."
      />
      <ReportPanel
        title="AI contribution"
        description="How much of each week's revenue the growth agent generated."
        icon={PieChart}
        awaiting="Needs attributed revenue from completed agent actions."
      />
      <ReportPanel
        title="Opportunity outcomes"
        description="Opportunities surfaced, approved, actioned and converted."
        icon={BarChart3}
        awaiting="Needs opportunities with recorded outcomes."
      />
    </div>
  );
}
