"use client";

import * as React from "react";
import { Search, Zap } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { MetricCard, MetricGrid } from "@/components/ui/metric-card";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableEmptyRow,
  TableWrapper,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui/table";
import { ResultCount, Toolbar, ToolbarGroup } from "@/components/ui/toolbar";
import { useDemoCollection } from "@/components/demo/demo-data";
import {
  formatCurrency,
  formatCurrencyCompact,
  formatDateTime,
  formatNumber,
  formatPercent,
} from "@/lib/format";
import { ACTION_RESULT_LABELS } from "@/lib/labels";
import { demoActions } from "@/lib/placeholder-data";
import type { AgentAction } from "@/types";

const RESULT_OPTIONS = [
  { label: "All results", value: "all" },
  ...Object.entries(ACTION_RESULT_LABELS).map(([value, spec]) => ({
    value,
    label: spec.label,
  })),
];

const COLUMN_COUNT = 6;

export interface ActionsViewProps {
  /** Actions the agent has taken. Empty until the AI agent is connected. */
  actions: AgentAction[];
}

export function ActionsView({ actions }: ActionsViewProps) {
  const source = useDemoCollection(actions, demoActions);

  const [query, setQuery] = React.useState("");
  const [result, setResult] = React.useState("all");

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();

    return source.filter((item) => {
      if (result !== "all" && item.result !== result) return false;
      if (!needle) return true;

      return [item.action, item.reason, item.customer.name, item.customer.email]
        .some((field) => field.toLowerCase().includes(needle));
    });
  }, [source, query, result]);

  const revenue = source.reduce(
    (total, item) => total + item.revenueGenerated,
    0,
  );
  const succeeded = source.filter((item) => item.result === "succeeded").length;
  const successRate = source.length ? (succeeded / source.length) * 100 : 0;

  const hasFilters = query !== "" || result !== "all";

  function clearFilters() {
    setQuery("");
    setResult("all");
  }

  return (
    <div className="space-y-6">
      <MetricGrid className="xl:grid-cols-3">
        <MetricCard
          label="Actions taken"
          value={source.length ? formatNumber(source.length) : "—"}
          hint="by the growth agent"
        />
        <MetricCard
          label="Revenue generated"
          value={source.length ? formatCurrencyCompact(revenue) : "—"}
          hint="attributed to these actions"
        />
        <MetricCard
          label="Success rate"
          value={source.length ? formatPercent(successRate) : "—"}
          hint="actions that produced a result"
        />
      </MetricGrid>

      <Card>
        <Toolbar>
          <ToolbarGroup>
            <Input
              icon={Search}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search actions or customers"
              aria-label="Search actions"
              wrapperClassName="w-full sm:w-64"
            />
            <Select
              options={RESULT_OPTIONS}
              value={result}
              onChange={(event) => setResult(event.target.value)}
              aria-label="Filter by result"
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
            noun={filtered.length === 1 ? "action" : "actions"}
          />
        </Toolbar>

        <TableWrapper>
          <Table className="min-w-[1020px]">
            <THead>
              <TR>
                <TH>Action</TH>
                <TH>Customer</TH>
                <TH>Reason</TH>
                <TH>Timestamp</TH>
                <TH>Result</TH>
                <TH align="right">Revenue generated</TH>
              </TR>
            </THead>
            <TBody>
              {filtered.length === 0 ? (
                <TableEmptyRow colSpan={COLUMN_COUNT}>
                  <EmptyState
                    icon={Zap}
                    title={
                      source.length === 0
                        ? "No agent activity yet"
                        : "No actions match these filters"
                    }
                    description={
                      source.length === 0
                        ? "Every action the AI agent takes on your behalf will be recorded here, along with why it acted and what it earned."
                        : "Try a different result, or clear the filters to see everything."
                    }
                    action={
                      source.length > 0 && hasFilters ? (
                        <Button size="sm" onClick={clearFilters}>
                          Clear filters
                        </Button>
                      ) : null
                    }
                  />
                </TableEmptyRow>
              ) : (
                filtered.map((item) => {
                  const spec = ACTION_RESULT_LABELS[item.result];

                  return (
                    <TR key={item.id} interactive>
                      <TD className="font-medium">{item.action}</TD>
                      <TD>
                        <span className="flex items-center gap-2">
                          <Avatar name={item.customer.name} size="sm" />
                          <span className="min-w-0">
                            <span className="block truncate">
                              {item.customer.name}
                            </span>
                            <span className="block truncate text-xs text-ink-muted">
                              {item.customer.email}
                            </span>
                          </span>
                        </span>
                      </TD>
                      <TD className="max-w-[300px] text-[13px] text-ink-muted">
                        {item.reason}
                      </TD>
                      <TD className="tabular text-[13px] whitespace-nowrap text-ink-muted">
                        {formatDateTime(item.timestamp)}
                      </TD>
                      <TD>
                        <Badge tone={spec.tone} dot>
                          {spec.label}
                        </Badge>
                      </TD>
                      <TD
                        align="right"
                        className={
                          item.revenueGenerated > 0
                            ? "tabular font-medium text-positive"
                            : "tabular text-ink-subtle"
                        }
                      >
                        {item.revenueGenerated > 0
                          ? formatCurrency(item.revenueGenerated)
                          : "—"}
                      </TD>
                    </TR>
                  );
                })
              )}
            </TBody>
          </Table>
        </TableWrapper>
      </Card>
    </div>
  );
}
