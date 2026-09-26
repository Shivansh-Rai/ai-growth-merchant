import "server-only";

import { z } from "zod";

import { Prisma, type Customer } from "@/lib/generated/prisma";
import { prisma } from "@/lib/prisma";

import { IdentityDomainError, parseIdentityInput } from "./errors";

/** Emails are compared case-insensitively within a store; stored lowercased. */
export const customerEmailSchema = z.string().trim().toLowerCase().pipe(z.email());

const createCustomerInputSchema = z
  .object({
    storeId: z.string().trim().min(1),
    email: customerEmailSchema,
    name: z.string().trim().min(1).nullable().optional(),
    phone: z.string().trim().min(1).nullable().optional(),
  })
  .strict();

export type CreateCustomerInput = z.infer<typeof createCustomerInputSchema>;

/**
 * Create a store-scoped Customer (INV-2).
 *
 * The (storeId, email) UNIQUE is the final authority: a concurrent duplicate
 * registration surfaces as CONFLICT, not as a second row.
 */
export async function createCustomer(input: unknown): Promise<Customer> {
  const data = parseIdentityInput(createCustomerInputSchema, input, "Invalid customer input");

  const store = await prisma.store.findUnique({
    where: { id: data.storeId },
    select: { id: true },
  });
  if (!store) {
    throw new IdentityDomainError("NOT_FOUND", "Store not found", { field: "storeId" });
  }

  try {
    return await prisma.customer.create({
      data: {
        storeId: data.storeId,
        email: data.email,
        name: data.name ?? null,
        phone: data.phone ?? null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new IdentityDomainError(
        "CONFLICT",
        "A customer with this email already exists in the store",
        { field: "email", cause: error },
      );
    }
    throw error;
  }
}
