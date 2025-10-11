import { z } from "zod";

export const createCardSchema = z.object({
  poolId: z.string().uuid("Invalid pool ID"),
  network: z.enum(["visa", "mastercard"]).default("visa"),
});

export const updateCardSchema = z.object({
  status: z.enum(["active", "suspended", "closed"]),
});

export const provisionApplePaySchema = z.object({
  certificates: z.array(z.string()),
  nonce: z.string(),
  nonceSignature: z.string(),
});

export type CreateCardInput = z.infer<typeof createCardSchema>;
export type UpdateCardInput = z.infer<typeof updateCardSchema>;
export type ProvisionApplePayInput = z.infer<typeof provisionApplePaySchema>;

