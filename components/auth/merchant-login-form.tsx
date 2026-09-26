"use client";

import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { loginMerchant, type MerchantLoginState } from "@/lib/auth/login-merchant";

const INITIAL: MerchantLoginState = { error: null };

/** Dashboard sign-in. Posts to the loginMerchant Server Function. */
export function MerchantLoginForm() {
  const [state, action, pending] = useActionState(loginMerchant, INITIAL);

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="username" required />
      </Field>
      <Field label="Password" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>

      {state.error ? (
        <p role="alert" className="rounded-md bg-critical-soft px-3 py-2 text-sm text-critical">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" variant="primary" size="lg" disabled={pending} className="justify-center">
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
