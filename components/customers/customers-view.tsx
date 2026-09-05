"use client";

import * as React from "react";
import { Search, Users } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
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
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { CUSTOMER_SEGMENT_LABELS } from "@/lib/labels";
import { demoCustomers } from "@/lib/placeholder-data";
import type { Customer } from "@/types";

const SEGMENT_OPTIONS = [
  { label: "All segments", value: "all" },
  ...Object.entries(CUSTOMER_SEGMENT_LABELS).map(([value, spec]) => ({
    value,
    label: spec.label,
  })),
];

const COLUMN_COUNT = 5;

export interface CustomersViewProps {
  /** Real customers. Empty until the store database is connected. */
  customers: Customer[];
}

export function CustomersView({ customers }: CustomersViewProps) {
  const source = useDemoCollection(customers, demoCustomers);

  const [query, setQuery] = React.useState("");
  const [segment, setSegment] = React.useState("all");

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();

    return source.filter((customer) => {
      if (segment !== "all" && customer.segment !== segment) return false;
      if (!needle) return true;

      return [customer.name, customer.email].some((field) =>
        field.toLowerCase().includes(needle),
      );
    });
  }, [source, query, segment]);

  const hasFilters = query !== "" || segment !== "all";

  function clearFilters() {
    setQuery("");
    setSegment("all");
  }

  return (
    <Card>
      <Toolbar>
        <ToolbarGroup>
          <Input
            icon={Search}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or email"
            aria-label="Search customers"
            wrapperClassName="w-full sm:w-64"
          />
          <Select
            options={SEGMENT_OPTIONS}
            value={segment}
            onChange={(event) => setSegment(event.target.value)}
            aria-label="Filter by segment"
            wrapperClassName="w-full sm:w-44"
          />
          {hasFilters ? (
            <Button size="sm" variant="ghost" onClick={clearFilters}>
              Clear
            </Button>
          ) : null}
        </ToolbarGroup>

        <ResultCount
          count={filtered.length}
          noun={filtered.length === 1 ? "customer" : "customers"}
        />
      </Toolbar>

      <TableWrapper>
        <Table className="min-w-[840px]">
          <THead>
            <TR>
              <TH>Customer</TH>
              <TH>Segment</TH>
              <TH align="right">Orders</TH>
              <TH align="right">Lifetime value</TH>
              <TH align="right">Last active</TH>
            </TR>
          </THead>
          <TBody>
            {filtered.length === 0 ? (
              <TableEmptyRow colSpan={COLUMN_COUNT}>
                <EmptyState
                  icon={Users}
                  title={
                    source.length === 0
                      ? "No customers yet"
                      : "No customers match these filters"
                  }
                  description={
                    source.length === 0
                      ? "Customers appear here once your storefront is live and the store database is connected."
                      : "Try a different segment, or clear the filters to see everyone."
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
              filtered.map((customer) => {
                const spec = CUSTOMER_SEGMENT_LABELS[customer.segment];

                return (
                  <TR key={customer.id} interactive>
                    <TD>
                      <span className="flex items-center gap-2.5">
                        <Avatar name={customer.name} />
                        <span className="min-w-0">
                          <span className="block truncate font-medium">
                            {customer.name}
                          </span>
                          <span className="block truncate text-xs text-ink-muted">
                            {customer.email}
                          </span>
                        </span>
                      </span>
                    </TD>
                    <TD>
                      <Badge tone={spec.tone} dot>
                        {spec.label}
                      </Badge>
                    </TD>
                    <TD align="right" className="tabular">
                      {formatNumber(customer.orderCount)}
                    </TD>
                    <TD align="right" className="tabular font-medium">
                      {formatCurrency(customer.lifetimeValue)}
                    </TD>
                    <TD
                      align="right"
                      className="tabular text-[13px] whitespace-nowrap text-ink-muted"
                    >
                      {formatDate(customer.lastActiveAt)}
                    </TD>
                  </TR>
                );
              })
            )}
          </TBody>
        </Table>
      </TableWrapper>
    </Card>
  );
}
