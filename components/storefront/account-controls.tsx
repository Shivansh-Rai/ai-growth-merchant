"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** Header account area: sign-in links for a guest, name + sign-out otherwise. */
export function AccountControls({
  storeSlug,
  customerName,
}: {
  storeSlug: string;
  customerName: string | null;
}) {
  const [pending, setPending] = useState(false);
  const router = useRouter();

  if (customerName === null) {
    return (
      <div className="flex items-center gap-4 text-sm">
        <Link href={`/s/${storeSlug}/login`} className="font-medium text-brand-700 hover:underline">
          Sign in
        </Link>
        <Link href={`/s/${storeSlug}/register`} className="text-ink-muted hover:text-navy">
          Register
        </Link>
      </div>
    );
  }

  async function signOut() {
    setPending(true);
    try {
      await fetch(`/api/s/${encodeURIComponent(storeSlug)}/auth/logout`, { method: "POST" });
    } finally {
      router.push(`/s/${storeSlug}`);
      router.refresh();
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="text-ink-muted">
        Signed in as <span className="font-medium text-navy">{customerName}</span>
      </span>
      <button
        type="button"
        onClick={signOut}
        disabled={pending}
        className="font-medium text-brand-700 hover:underline disabled:opacity-50"
      >
        Sign out
      </button>
    </div>
  );
}
