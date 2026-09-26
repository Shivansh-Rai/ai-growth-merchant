import "server-only";

import { z } from "zod";

import type { Customer } from "@/lib/generated/prisma";
import { prisma } from "@/lib/prisma";

import { customerEmailSchema } from "./create-customer";
import { parseIdentityInput } from "./errors";

const byEmailSchema = z
  .object({
    storeId: z.string().trim().min(1),
    email: customerEmailSchema,
  })
  .strict();

const byIdSchema = z
  .object({
    storeId: z.string().trim().min(1),
    customerId: z.string().trim().min(1),
  })
  .strict();

/** Store-scoped lookup. The same email in another store is a different Customer. */
export async function getCustomerByEmail(
  storeId: string,
  email: string,
): Promise<Customer | null> {
  const data = parseIdentityInput(byEmailSchema, { storeId, email }, "Invalid customer lookup");
  return prisma.customer.findUnique({
    where: { storeId_email: { storeId: data.storeId, email: data.email } },
  });
}

/** Store-scoped lookup. Never resolves by customerId alone. */
export async function getCustomer(storeId: string, customerId: string): Promise<Customer | null> {
  const data = parseIdentityInput(byIdSchema, { storeId, customerId }, "Invalid customer lookup");
  return prisma.customer.findUnique({
    where: { storeId_id: { storeId: data.storeId, id: data.customerId } },
  });
}
