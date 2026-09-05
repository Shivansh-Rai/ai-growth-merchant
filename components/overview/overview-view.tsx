"use client";

import Link from "next/link";
import { IndianRupee, Sparkles, Target, TrendingUp, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricCard, MetricGrid } from "@/components/ui/metric-card";
import { SectionHeading } from "@/components/layout/page-container";
import {
  useDemoCollection,
  useDemoValue,
} from "@/components/demo/demo-data";
import { OpportunityCard } from "@/components/growth/opportunity-card";
import {
  formatCurrency,
  formatCurrencyCompact,
  formatNumber,
  formatPercent,
  formatTime,
} from "@/lib/format";
import { ACTION_RESULT_LABELS } from "@/lib/labels";
import {
  demoActions,
  demoOpportunities,
  demoOverviewMetrics,
  type OverviewMetrics,
} from "@/lib/placeholder-data";
import type { AgentAction, Opportunity } from "@/types";

/** Placeholder shown by every metric tile before real data exists. */
const NO_VALUE = "—";

const TOP_OPPORTUNITY_COUNT = 3;
const RECENT_ACTION_COUNT = 5;

function ViewAllLink({ href, children }: { href: string; children: string }) {
  return (
    <Link
      href={href}
      className="text-[13px] font-medium text-brand-600 underline-offset-4 hover:underline"
    >
      {children}
    </Link>
  );
}

export interface OverviewViewProps {
  /** Aggregated store metrics. Null until analytics are wired up. */
  metrics: OverviewMetrics | null;
  opportunities: Opportunity[];
  actions: AgentAction[];
}

export function OverviewView({
  metrics,
  opportunities,
  actions,
}: OverviewViewProps) {
  const stats = useDemoValue(metrics, demoOverviewMetrics);
  const allOpportunities = useDemoCollection(opportunities, demoOpportunities);
  const allActions = useDemoCollection(actions, demoActions);

  const topOpportunities = allOpportunities
    .filter((item) => item.status === "new" || item.status === "in_review")
    .slice(0, TOP_OPPORTUNITY_COUNT);

  const recentActions = allActions.slice(0, RECENT_ACTION_COUNT);

  const aiShare =
    stats && stats.revenue > 0
      ? (stats.aiAttributedRevenue / stats.revenue) * 100
      : null;

  return (
    <div className="space-y-6">
      <MetricGrid>
        <MetricCard
          icon={IndianRupee}
          label="Revenue generated"
          value={stats ? formatCurrencyCompact(stats.revenue) : NO_VALUE}
          hint={stats ? undefined : "no orders recorded yet"}
          delta={
            stats
              ? { value: stats.deltas.revenue, label: "vs last 30 days" }
              : undefined
          }
        />
        <MetricCard
          icon={Sparkles}
          label="AI-attributed revenue"
          value={
            stats ? formatCurrencyCompact(stats.aiAttributedRevenue) : NO_VALUE
          }
          hint={
            aiShare !== null
              ? `${formatPercent(aiShare)} of total revenue`
              : "the agent has not acted yet"
          }
          delta={
            stats
              ? {
                  value: stats.deltas.aiAttributedRevenue,
                  label: "vs last 30 days",
                }
              : undefined
          }
        />
        <MetricCard
          icon={Target}
          label="Growth opportunities"
          value={stats ? formatNumber(stats.openOpportunities) : NO_VALUE}
          hint={stats ? "open right now" : "nothing detected yet"}
          delta={
            stats
              ? {
                  value: stats.deltas.openOpportunities,
                  label: "vs last 30 days",
                }
              : undefined
          }
        />
        <MetricCard
          icon={TrendingUp}
          label="Conversion rate"
          value={stats ? formatPercent(stats.conversionRate) : NO_VALUE}
          hint={stats ? undefined : "needs storefront traffic"}
          delta={
            stats
              ? {
                  value: stats.deltas.conversionRate,
                  label: "vs last 30 days",
                }
              : undefined
          }
        />
      </MetricGrid>

      <div className="grid gap-6 xl:grid-cols-3">
        <section className="space-y-3 xl:col-span-2">
          <SectionHeading
            title="Top growth opportunities"
            description="The highest-value openings the agent has surfaced and not yet acted on."
            action={
              <ViewAllLink href="/growth/opportunities">View all</ViewAllLink>
            }
          />

          {topOpportunities.length === 0 ? (
            <Card>
              <EmptyState
                icon={Target}
                title="No open opportunities"
                description="When the AI agent spots a way to grow revenue — a cheaper alternative for a stalled cart, a timely reorder — it will appear here first."
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {topOpportunities.map((opportunity) => (
                <OpportunityCard
                  key={opportunity.id}
                  opportunity={opportunity}
                  compact
                />
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <SectionHeading
            title="Recent AI actions"
            action={<ViewAllLink href="/growth/actions">View all</ViewAllLink>}
          />

          <Card>
            {recentActions.length === 0 ? (
              <EmptyState
                size="inline"
                icon={Zap}
                title="No agent activity"
                description="Actions taken on your behalf will show up here."
              />
            ) : (
              <ul className="divide-y divide-line">
                {recentActions.map((action) => {
                  const spec = ACTION_RESULT_LABELS[action.result];

                  return (
                    <li key={action.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-[13px] leading-5 font-medium text-navy">
                          {action.action}
                        </p>
                        {action.revenueGenerated > 0 ? (
                          <p className="tabular shrink-0 text-[13px] font-semibold text-positive">
                            {formatCurrency(action.revenueGenerated)}
                          </p>
                        ) : null}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-ink-muted">
                        {action.customer.name}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge tone={spec.tone} dot>
                          {spec.label}
                        </Badge>
                        <span className="tabular text-xs text-ink-subtle">
                          {formatTime(action.timestamp)}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </section>
      </div>
    </div>
  );
}
