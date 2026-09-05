"use client";

import * as React from "react";
import { Bot, Search, Server, ScrollText, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ResultCount, Toolbar, ToolbarGroup } from "@/components/ui/toolbar";
import { useDemoCollection } from "@/components/demo/demo-data";
import { formatSignedCurrency, formatTime, groupByDay } from "@/lib/format";
import { AUDIT_ACTOR_LABELS, AUDIT_CATEGORY_LABELS } from "@/lib/labels";
import { demoAuditLog } from "@/lib/placeholder-data";
import { cn } from "@/lib/utils";
import type { AuditActorType, AuditLogEntry } from "@/types";

const ACTOR_ICONS: Record<AuditActorType, typeof Bot> = {
  ai_agent: Bot,
  merchant: UserRound,
  system: Server,
};

const CATEGORY_OPTIONS = [
  { label: "All categories", value: "all" },
  ...Object.entries(AUDIT_CATEGORY_LABELS).map(([value, spec]) => ({
    value,
    label: spec.label,
  })),
];

const ACTOR_OPTIONS = [
  { label: "All actors", value: "all" },
  ...Object.entries(AUDIT_ACTOR_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

export interface AuditLogViewProps {
  /** Real log entries. Empty until decisions and payments are recorded. */
  entries: AuditLogEntry[];
}

/**
 * Reverse-chronological record of AI decisions and money movement, bucketed by
 * day. Entries are read-only by design — an audit trail is append-only.
 */
export function AuditLogView({ entries }: AuditLogViewProps) {
  const source = useDemoCollection(entries, demoAuditLog);

  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState("all");
  const [actor, setActor] = React.useState("all");

  const filtered = React.useMemo(() => {
    const needle = query.trim().toLowerCase();

    return source
      .filter((entry) => {
        if (category !== "all" && entry.category !== category) return false;
        if (actor !== "all" && entry.actor.type !== actor) return false;
        if (!needle) return true;

        return [entry.summary, entry.detail ?? "", entry.actor.name].some(
          (field) => field.toLowerCase().includes(needle),
        );
      })
      .slice()
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
  }, [source, query, category, actor]);

  const groups = React.useMemo(
    () => groupByDay(filtered, (entry) => entry.timestamp),
    [filtered],
  );

  const hasFilters = query !== "" || category !== "all" || actor !== "all";

  function clearFilters() {
    setQuery("");
    setCategory("all");
    setActor("all");
  }

  return (
    <Card>
      <Toolbar className="lg:flex-row lg:items-center">
        <ToolbarGroup>
          <Input
            icon={Search}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search the log"
            aria-label="Search audit log"
            wrapperClassName="w-full sm:w-64"
          />
          <Select
            options={CATEGORY_OPTIONS}
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            aria-label="Filter by category"
            wrapperClassName="w-full sm:w-44"
          />
          <Select
            options={ACTOR_OPTIONS}
            value={actor}
            onChange={(event) => setActor(event.target.value)}
            aria-label="Filter by actor"
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
          noun={filtered.length === 1 ? "entry" : "entries"}
        />
      </Toolbar>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title={
            source.length === 0
              ? "Nothing recorded yet"
              : "No entries match these filters"
          }
          description={
            source.length === 0
              ? "Every AI decision and money-related action will be written here as it happens, with the reasoning behind it."
              : "Try a different category or actor, or clear the filters to see the full log."
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
        groups.map((group) => (
          <section key={group.key}>
            <h3 className="border-b border-line bg-surface-muted px-5 py-2 text-[11px] font-semibold tracking-wide text-ink-muted uppercase">
              {group.label}
            </h3>
            <ul className="divide-y divide-line">
              {group.entries.map((entry) => {
                const spec = AUDIT_CATEGORY_LABELS[entry.category];
                const ActorIcon = ACTOR_ICONS[entry.actor.type];

                return (
                  <li key={entry.id} className="flex gap-3 px-5 py-4 sm:gap-4">
                    <span
                      aria-hidden
                      className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border border-line bg-white"
                    >
                      <ActorIcon className="size-3.5 text-ink-muted" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
                        <p className="text-sm font-medium text-navy">
                          {entry.summary}
                        </p>
                        {entry.amount !== undefined ? (
                          <p
                            className={cn(
                              "tabular shrink-0 text-sm font-semibold",
                              entry.amount >= 0
                                ? "text-positive"
                                : "text-critical",
                            )}
                          >
                            {formatSignedCurrency(entry.amount)}
                          </p>
                        ) : null}
                      </div>

                      {entry.detail ? (
                        <p className="mt-1 text-[13px] leading-6 text-ink-muted">
                          {entry.detail}
                        </p>
                      ) : null}

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge tone={spec.tone}>{spec.label}</Badge>
                        <span className="text-xs text-ink-muted">
                          {AUDIT_ACTOR_LABELS[entry.actor.type]} ·{" "}
                          {entry.actor.name}
                        </span>
                        <span
                          aria-hidden
                          className="size-1 rounded-full bg-line-strong"
                        />
                        <span className="tabular text-xs text-ink-muted">
                          {formatTime(entry.timestamp)}
                        </span>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </Card>
  );
}
