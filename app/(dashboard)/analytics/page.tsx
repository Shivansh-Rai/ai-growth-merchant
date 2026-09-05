import type { Metadata } from "next";
import {
  PageContainer,
  PageIntro,
} from "@/components/layout/page-container";
import { AnalyticsView } from "@/components/analytics/analytics-view";

export const metadata: Metadata = { title: "Analytics" };

export default function AnalyticsPage() {
  return (
    <PageContainer>
      <PageIntro description="Reporting on store performance and the revenue the AI agent is responsible for. The panels below are reserved for reports that arrive with the data." />
      <AnalyticsView />
    </PageContainer>
  );
}
