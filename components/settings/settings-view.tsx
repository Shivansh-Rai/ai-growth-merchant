import { Bot, CreditCard, Database, Mail, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Input } from "@/components/ui/input";
import { MERCHANT_PROFILE } from "@/lib/merchant";

/** Systems this dashboard will connect to, none of which exist yet. */
const INTEGRATIONS: {
  name: string;
  description: string;
  icon: LucideIcon;
}[] = [
  {
    name: "Store database",
    description: "Customers, products and orders that power the dashboard.",
    icon: Database,
  },
  {
    name: "Payments",
    description: "Collect payments and reconcile AI-attributed revenue.",
    icon: CreditCard,
  },
  {
    name: "Email & notifications",
    description: "Deliver the messages the growth agent decides to send.",
    icon: Mail,
  },
];

export function SettingsView() {
  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card className="xl:col-span-2">
        <CardHeader>
          <CardTitle>Store profile</CardTitle>
          <CardDescription>
            How your store is identified across the dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-2">
          <Field
            label="Store name"
            htmlFor="store-name"
            description="Shown in the sidebar and on merchant-facing screens."
          >
            <Input
              id="store-name"
              defaultValue={MERCHANT_PROFILE.storeName}
              readOnly
            />
          </Field>
          <Field
            label="Contact email"
            htmlFor="contact-email"
            description="Where account notices will be sent."
          >
            <Input
              id="contact-email"
              type="email"
              defaultValue={MERCHANT_PROFILE.email}
              readOnly
            />
          </Field>
        </CardContent>
        <CardFooter>
          <p className="text-xs text-ink-muted">
            Editing becomes available once the store database is connected.
          </p>
          <Button
            variant="primary"
            size="sm"
            disabled
            title="Available once the store database is connected"
          >
            Save changes
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI growth agent</CardTitle>
          <CardDescription>
            Limits and approvals that govern what the agent may do on its own.
          </CardDescription>
        </CardHeader>
        <EmptyState
          icon={Bot}
          title="Agent not connected"
          description="Once the growth agent is running, its spending limits, approval rules and send frequency will be configured here."
        />
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>
            Systems the dashboard reads from and writes to.
          </CardDescription>
        </CardHeader>
        <ul className="divide-y divide-line">
          {INTEGRATIONS.map((integration) => {
            const Icon = integration.icon;

            return (
              <li
                key={integration.name}
                className="flex items-start gap-3 px-5 py-4"
              >
                <span
                  aria-hidden
                  className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md border border-line bg-surface-muted"
                >
                  <Icon className="size-4 text-ink-muted" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-navy">
                    {integration.name}
                  </p>
                  <p className="mt-0.5 text-[13px] leading-5 text-ink-muted">
                    {integration.description}
                  </p>
                </div>
                <Badge tone="neutral" dot className="mt-0.5 shrink-0">
                  Not connected
                </Badge>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
