"use client";

import * as React from "react";

/**
 * Client-side switch that swaps illustrative rows in for empty collections.
 *
 * This exists purely so the dashboard can be reviewed at realistic density
 * before the database is built. It is a thin, removable layer: pages fetch and
 * pass real data as props, and the hooks below only substitute demo rows when
 * that real data is empty *and* the switch is on.
 *
 * To retire it: delete the `components/demo` folder and `lib/placeholder-data.ts`,
 * then drop the `<DemoToggle />` from components/layout/header.tsx and the
 * `useDemo*` calls from each view. No page or component contract changes.
 *
 * Starts on so a fresh checkout shows a populated dashboard. Set this to false
 * to land on genuine empty states instead.
 */
const DEMO_ENABLED_BY_DEFAULT = true;

const STORAGE_KEY = "ngs:demo-data";

/*
 * Backed by a module-level store rather than component state so the preference
 * survives navigation and stays readable from any view without a provider.
 * `useSyncExternalStore` reads it hydration-safely: the server and the first
 * client render both use the default, and the stored value is applied after.
 */

let listeners: (() => void)[] = [];
let snapshot: boolean | null = null;

function getSnapshot(): boolean {
  if (snapshot === null) {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      snapshot = stored === null ? DEMO_ENABLED_BY_DEFAULT : stored === "true";
    } catch {
      // Storage can be unavailable (private mode, blocked cookies) — the
      // default is a perfectly good fallback.
      snapshot = DEMO_ENABLED_BY_DEFAULT;
    }
  }
  return snapshot;
}

function getServerSnapshot(): boolean {
  return DEMO_ENABLED_BY_DEFAULT;
}

function subscribe(listener: () => void) {
  listeners = [...listeners, listener];
  return () => {
    listeners = listeners.filter((entry) => entry !== listener);
  };
}

function setDemoEnabled(next: boolean) {
  snapshot = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, String(next));
  } catch {
    // Non-fatal: the toggle still works for this session.
  }
  for (const listener of listeners) listener();
}

export function useDemoMode() {
  const enabled = React.useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  return { enabled, setEnabled: setDemoEnabled };
}

/**
 * Returns the demo collection while demo mode is on and no real rows exist yet.
 * Once a page passes real data, that data always wins.
 */
export function useDemoCollection<T>(real: T[], demo: T[]): T[] {
  const { enabled } = useDemoMode();
  return enabled && real.length === 0 ? demo : real;
}

/** Single-value counterpart to `useDemoCollection`, for metric objects. */
export function useDemoValue<T>(real: T | null, demo: T): T | null {
  const { enabled } = useDemoMode();
  return real ?? (enabled ? demo : null);
}
