import type { Metadata } from "next";
import {
  PageContainer,
  PageIntro,
} from "@/components/layout/page-container";
import { ActionsView } from "@/components/growth/actions-view";

export const metadata: Metadata = { title: "AI Actions" };

export default function ActionsPage() {
  // Agent actions will be fetched here once the AI agent is connected.
  return (
    <PageContainer>
      <PageIntro description="Everything the growth agent has actually done on your behalf, with the reasoning behind each decision and what it earned." />
      <ActionsView actions={[]} />
    </PageContainer>
  );
}
