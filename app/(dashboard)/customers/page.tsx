import type { Metadata } from "next";
import {
  PageContainer,
  PageIntro,
} from "@/components/layout/page-container";
import { CustomersView } from "@/components/customers/customers-view";

export const metadata: Metadata = { title: "Customers" };

export default function CustomersPage() {
  // Customers will be fetched here once the store database is connected.
  return (
    <PageContainer>
      <PageIntro description="Everyone who has shopped with you, with the signals the growth agent uses to decide who to act on next." />
      <CustomersView customers={[]} />
    </PageContainer>
  );
}
