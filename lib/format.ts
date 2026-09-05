/** Shared display formatters. Keep every user-visible number funnelling here. */

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

/** ₹2,500 */
export function formatCurrency(value: number) {
  return inr.format(value);
}

/** ₹2,500 for small figures, ₹1.2L / ₹4.8Cr for large ones. */
export function formatCurrencyCompact(value: number) {
  const abs = Math.abs(value);
  if (abs >= 10_000_000) return `₹${(value / 10_000_000).toFixed(2)}Cr`;
  if (abs >= 100_000) return `₹${(value / 100_000).toFixed(2)}L`;
  return formatCurrency(value);
}

/** +₹2,320 / −₹480 — for deltas where the sign carries meaning. */
export function formatSignedCurrency(value: number) {
  const formatted = formatCurrency(Math.abs(value));
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `−${formatted}`;
  return formatted;
}

/** 3.4% */
export function formatPercent(value: number, fractionDigits = 1) {
  return `${value.toFixed(fractionDigits)}%`;
}

/** 1,284 */
export function formatNumber(value: number) {
  return new Intl.NumberFormat("en-IN").format(value);
}

/** 6 Sep 2026 */
export function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(iso));
}

/** 6 Sep 2026, 3:42 pm */
export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

/** 3:42 pm */
export function formatTime(iso: string) {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

/**
 * Groups a chronological list into date buckets for day-separated timelines.
 *
 * Timestamps are always rendered absolutely rather than as "3 minutes ago":
 * an audit trail covering money movement needs exact times, and absolute values
 * render identically on the server and the client.
 */
export function groupByDay<T>(items: T[], getDate: (item: T) => string) {
  const groups = new Map<string, T[]>();

  for (const item of items) {
    const key = new Date(getDate(item)).toDateString();
    const bucket = groups.get(key);
    if (bucket) bucket.push(item);
    else groups.set(key, [item]);
  }

  return [...groups.entries()].map(([key, entries]) => ({
    key,
    label: formatDate(new Date(key).toISOString()),
    entries,
  }));
}
