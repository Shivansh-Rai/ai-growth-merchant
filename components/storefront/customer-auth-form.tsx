"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";

/**
 * Login / register form. Posts JSON to the store's auth route; the server sets
 * the cookie. On success, navigate home and refresh so the server-rendered
 * layout re-reads the auth cookie.
 */
export function CustomerAuthForm({
  mode,
  storeSlug,
}: {
  mode: "login" | "register";
  storeSlug: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/s/${encodeURIComponent(storeSlug)}/auth/${mode}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form)),
      });
      if (response.ok) {
        router.push(`/s/${storeSlug}`);
        router.refresh();
        return;
      }
      const body: { error?: string } = await response.json().catch(() => ({}));
      setError(body.error ?? "Something went wrong. Please try again.");
    } catch {
      setError("Could not reach the store. Please try again.");
    }
    setPending(false);
  }

  const isRegister = mode === "register";

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
      {isRegister ? (
        <Field label="Name" htmlFor="name">
          <Input id="name" name="name" autoComplete="name" />
        </Field>
      ) : null}
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>
      <Field
        label="Password"
        htmlFor="password"
        description={isRegister ? "At least 8 characters." : undefined}
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          required
        />
      </Field>

      {error ? (
        <p role="alert" className="rounded-md bg-critical-soft px-3 py-2 text-sm text-critical">
          {error}
        </p>
      ) : null}

      <Button type="submit" variant="primary" size="lg" disabled={pending} className="justify-center">
        {pending ? "Please wait…" : isRegister ? "Create account" : "Sign in"}
      </Button>

      <p className="text-center text-sm text-ink-muted">
        {isRegister ? "Already have an account? " : "New here? "}
        <Link
          href={`/s/${storeSlug}/${isRegister ? "login" : "register"}`}
          className="font-medium text-brand-700 hover:underline"
        >
          {isRegister ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
