import type { Metadata } from "next";
import {
  PageContainer,
  PageIntro,
} from "@/components/layout/page-container";
import { OpportunitiesView } from "@/components/growth/opportunities-view";

export const metadata: Metadata = { title: "Opportunities" };

export default function OpportunitiesPage() {
  // Opportunities will be fetched here once the AI agent is connected.
  return (
    <PageContainer>
      <PageIntro description="Revenue the AI agent believes is available right now — what it proposes doing, why, and what each move is worth." />
      <OpportunitiesView opportunities={[]} />
    </PageContainer>
  );
}
