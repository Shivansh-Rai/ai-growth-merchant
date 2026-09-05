import type { Metadata } from "next";
import {
  PageContainer,
  PageIntro,
} from "@/components/layout/page-container";
import { OverviewView } from "@/components/overview/overview-view";

export const metadata: Metadata = { title: "Overview" };

export default function OverviewPage() {
  // Metrics, opportunities and actions will be fetched here once the database
  // and AI agent exist. Until then the view renders its empty states.
  return (
    <PageContainer>
      <PageIntro description="A single view of how your store is performing and what the AI growth agent is doing about it." />
      <OverviewView metrics={null} opportunities={[]} actions={[]} />
    </PageContainer>
  );
}
