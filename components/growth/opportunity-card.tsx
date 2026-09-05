import { ArrowRight, Lightbulb } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateTime, formatSignedCurrency } from "@/lib/format";
import {
  OPPORTUNITY_STATUS_LABELS,
  OPPORTUNITY_TYPE_LABELS,
} from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { Opportunity } from "@/types";

function FieldBlock({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-[11px] font-semibold tracking-wide text-ink-subtle uppercase">
        {label}
      </p>
      <div className="mt-1 text-[13px] leading-6 text-navy">{children}</div>
    </div>
  );
}

export interface OpportunityCardProps {
  opportunity: Opportunity;
  /** Drops the reason and footer — used in the Overview digest. */
  compact?: boolean;
  className?: string;
}

/**
 * One AI-surfaced growth opportunity, showing every field a merchant needs to
 * judge it: who it affects, what the agent proposes, why, what it is worth, and
 * where it stands.
 */
export function OpportunityCard({
  opportunity,
  compact = false,
  className,
}: OpportunityCardProps) {
  const type = OPPORTUNITY_TYPE_LABELS[opportunity.type];
  const status = OPPORTUNITY_STATUS_LABELS[opportunity.status];
  const impact = opportunity.expectedRevenueImpact;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={type.tone}>{type.label}</Badge>
              <Badge tone={status.tone} dot>
                {status.label}
              </Badge>
            </div>
            <h3 className="mt-2.5 text-[15px] leading-6 font-semibold text-navy">
              {opportunity.title}
            </h3>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[11px] font-semibold tracking-wide text-ink-subtle uppercase">
              Expected impact
            </p>
            <p
              className={cn(
                "tabular mt-0.5 text-lg font-semibold",
                impact >= 0 ? "text-positive" : "text-critical",
              )}
            >
              {formatSignedCurrency(impact)}
            </p>
          </div>
        </div>

        <div
          className={cn(
            "mt-4 grid gap-4",
            !compact && "md:grid-cols-[minmax(0,200px)_minmax(0,1fr)] md:gap-6",
          )}
        >
          <FieldBlock label="Customer">
            <span className="flex items-center gap-2">
              <Avatar name={opportunity.customer.name} size="sm" />
              <span className="min-w-0">
                <span className="block truncate font-medium">
                  {opportunity.customer.name}
                </span>
                <span className="block truncate text-xs text-ink-muted">
                  {opportunity.customer.email}
                </span>
              </span>
            </span>
          </FieldBlock>

          <div className="min-w-0 space-y-4">
            <FieldBlock label="Recommended action">
              <span className="flex gap-2">
                <ArrowRight
                  aria-hidden
                  className="mt-1.5 size-3.5 shrink-0 text-brand-600"
                />
                <span>{opportunity.recommendedAction}</span>
              </span>
            </FieldBlock>

            {compact ? null : (
              <FieldBlock label="Reason">
                <span className="flex gap-2 text-ink-muted">
                  <Lightbulb
                    aria-hidden
                    className="mt-1.5 size-3.5 shrink-0 text-ink-subtle"
                  />
                  <span>{opportunity.reason}</span>
                </span>
              </FieldBlock>
            )}
          </div>
        </div>
      </div>

      {compact ? null : (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-surface-muted px-5 py-3">
          <p className="text-xs text-ink-muted">
            Detected {formatDateTime(opportunity.detectedAt)}
          </p>
          {/*
            Review actions are inert until the AI agent and its approval flow
            exist. Approving an opportunity triggers a money-affecting write, so
            these stay disabled rather than simulating a result.
          */}
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              disabled
              title="Available once the AI agent is connected"
            >
              Dismiss
            </Button>
            <Button
              size="sm"
              variant="primary"
              disabled
              title="Available once the AI agent is connected"
            >
              Approve
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
