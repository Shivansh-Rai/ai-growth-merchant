import type { Metadata } from "next";
import {
  PageContainer,
  PageIntro,
} from "@/components/layout/page-container";
import { AuditLogView } from "@/components/audit-logs/audit-log-view";

export const metadata: Metadata = { title: "Audit Logs" };

export default function AuditLogsPage() {
  // Log entries will be fetched here once decisions and payments are recorded.
  return (
    <PageContainer>
      <PageIntro description="A permanent, chronological record of every AI decision and money-related action taken in your store." />
      <AuditLogView entries={[]} />
    </PageContainer>
  );
}
