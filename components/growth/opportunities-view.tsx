"use client";

import * as React from "react";
import { Search, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { MetricCard, MetricGrid } from "@/components/ui/metric-card";
import { Select } from "@/components/ui/select";
import { ResultCount, ToolbarGroup } from "@/components/ui/toolbar";
import { useDemoCollection } from "@/components/demo/demo-data";
import { formatCurrencyCompact, formatNumber } from "@/lib/format";
import {
  OPPORTUNITY_STATUS_LABELS,
  OPPORTUNITY_TYPE_LABELS,
} from "@/lib/labels";
import { demoOpportunities } from "@/lib/placeholder-data";
import type { Opportunity, OpportunityStatus } from "@/types";
import { OpportunityCard } from "./opportunity-card";

/** Statuses that still need the merchant's attention. */
const OPEN_STATUSES: OpportunityStatus[] = ["new", "in_review", "approved"];

const TYPE_OPTIONS = [
  { label: "All types", value: "all" },
  ...Object.entries(OPPORTUNITY_TYPE_LABELS).map(([value, spec]) => ({
    value,
    label: spec.label,
  })),
];

const STATUS_OPTIONS = [
  { label: "All statuses", value: "all" },
  ...Object.entries(OPPORTUNITY_STATUS_LABELS).map(([value, spec]) => ({
    value,
    label: spec.label,
  })),
];

export interface OpportunitiesViewProps {
  /** Real opportunities. Empty until the AI agent is connected. */
  opportunities: Opportunity[];
}

export function OpportunitiesView({ opportunities }: OpportunitiesViewProps) {
  const source = useDemoCollection(opportunities, demoOpportunities);

  const [query, setQuery] = React.useState("");
  const [type, setType] = React.useState("all");
  const [status, setStatus] = React.useState("all");

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();

    return source.filter((item) => {
      if (type !== "all" && item.type !== type) return false;
      if (status !== "all" && item.status !== status) return false;
      if (!needle) return true;

      return [
        item.title,
        item.customer.name,
        item.customer.email,
        item.recommendedAction,
        item.reason,
      ].some((field) => field.toLowerCase().includes(needle));
    });
  }, [source, query, type, status]);

  const openItems = source.filter((item) =>
    OPEN_STATUSES.includes(item.status),
  );
  const openImpact = openItems.reduce(
    (total, item) => total + item.expectedRevenueImpact,
    0,
  );
  const actionedCount = source.filter(
    (item) => item.status === "actioned",
  ).length;

  const hasFilters = query !== "" || type !== "all" || status !== "all";

  function clearFilters() {
    setQuery("");
    setType("all");
    setStatus("all");
  }

  return (
    <div className="space-y-6">
      <MetricGrid className="xl:grid-cols-3">
        <MetricCard
          label="Open opportunities"
          value={source.length ? formatNumber(openItems.length) : "—"}
          hint={
            source.length ? "awaiting review or approval" : "nothing detected yet"
          }
        />
        <MetricCard
          label="Expected revenue impact"
          value={source.length ? formatCurrencyCompact(openImpact) : "—"}
          hint="if every open opportunity is actioned"
        />
        <MetricCard
          label="Actioned"
          value={source.length ? formatNumber(actionedCount) : "—"}
          hint="carried out by the agent"
        />
      </MetricGrid>

      <div className="rounded-lg border border-line bg-white">
        <div className="flex flex-col gap-3 border-b border-line px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <ToolbarGroup className="flex-1">
            <Input
              icon={Search}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search opportunities or customers"
              aria-label="Search opportunities"
              wrapperClassName="w-full sm:max-w-xs"
            />
            <Select
              options={TYPE_OPTIONS}
              value={type}
              onChange={(event) => setType(event.target.value)}
              aria-label="Filter by opportunity type"
              wrapperClassName="w-full sm:w-44"
            />
            <Select
              options={STATUS_OPTIONS}
              value={status}
              onChange={(event) => setStatus(event.target.value)}
              aria-label="Filter by status"
              wrapperClassName="w-full sm:w-40"
            />
            {hasFilters ? (
              <Button size="sm" variant="ghost" onClick={clearFilters}>
                Clear
              </Button>
            ) : null}
          </ToolbarGroup>

          <ResultCount
            count={filtered.length}
            noun={filtered.length === 1 ? "opportunity" : "opportunities"}
            className="shrink-0"
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Target}
            title={
              source.length === 0
                ? "No opportunities yet"
                : "No opportunities match these filters"
            }
            description={
              source.length === 0
                ? "Once the AI agent is connected it will analyse carts, browsing and purchase history, and surface revenue opportunities here."
                : "Try a different type or status, or clear the filters to see everything."
            }
            action={
              source.length > 0 && hasFilters ? (
                <Button size="sm" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : null
            }
          />
        ) : (
          <div className="space-y-4 p-4">
            {filtered.map((opportunity) => (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                className="border-line"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
