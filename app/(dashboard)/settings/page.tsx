import type { Metadata } from "next";
import {
  PageContainer,
  PageIntro,
} from "@/components/layout/page-container";
import { SettingsView } from "@/components/settings/settings-view";
import { getMerchantProfile, requireMerchant } from "@/lib/auth/require-merchant";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const merchant = await getMerchantProfile(await requireMerchant());

  return (
    <PageContainer>
      <PageIntro description="Store details, agent controls and the systems this dashboard connects to." />
      <SettingsView merchant={merchant} />
    </PageContainer>
  );
}
