import "server-only";

import { z } from "zod";

import { createCustomer, customerEmailSchema } from "@/lib/identity/create-customer";
import { IdentityDomainError } from "@/lib/identity/errors";

import type { CustomerAuth } from "./customer-session";
import { AuthDomainError } from "./errors";
import { signInOnSession } from "./login-customer";
import { hashPassword, passwordSchema } from "./password";

const registerCustomerInputSchema = z
  .object({
    storeId: z.string().trim().min(1),
    sessionId: z.string().trim().min(1),
    email: customerEmailSchema,
    password: passwordSchema,
    name: z.string().trim().min(1).max(120).nullable().optional(),
  })
  .strict();

export type RegisterCustomerInput = z.infer<typeof registerCustomerInputSchema>;

/**
 * Create a store-scoped Customer with credentials, then sign them in on the
 * running Session exactly as login does (backfill included).
 *
 * The same email at another store is a different Customer, by design
 * (INV-2, ADR-2.8-009).
 */
export async function registerCustomer(input: unknown): Promise<CustomerAuth> {
  const parsed = registerCustomerInputSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    throw new AuthDomainError("VALIDATION", first?.message ?? "Invalid registration", {
      field: first?.path.join(".") || undefined,
    });
  }
  const data = parsed.data;

  let customerId: string;
  try {
    const customer = await createCustomer({
      storeId: data.storeId,
      email: data.email,
      name: data.name ?? null,
      passwordHash: await hashPassword(data.password),
    });
    customerId = customer.id;
  } catch (error) {
    if (error instanceof IdentityDomainError && error.code === "CONFLICT") {
      throw new AuthDomainError("CONFLICT", "An account with this email already exists", {
        field: "email",
      });
    }
    throw error;
  }

  const { auth } = await signInOnSession(data.storeId, data.sessionId, customerId);
  return auth;
}
