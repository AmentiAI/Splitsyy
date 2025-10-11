import { z } from "zod";

export const createPoolSchema = z.object({
  groupId: z.string().uuid("Invalid group ID"),
  targetAmount: z.number().int().positive("Target amount must be positive"),
  designatedPayer: z.string().uuid("Invalid user ID").optional(),
});

export const updatePoolSchema = z.object({
  targetAmount: z.number().int().positive("Target amount must be positive").optional(),
  designatedPayer: z.string().uuid("Invalid user ID").nullable().optional(),
  status: z.enum(["open", "closed"]).optional(),
});

export const createContributionSchema = z.object({
  amount: z.number().int().positive("Amount must be positive"),
  method: z.enum(["card", "ach"]),
  paymentMethodId: z.string().optional(), // Stripe payment method ID
});

export type CreatePoolInput = z.infer<typeof createPoolSchema>;
export type UpdatePoolInput = z.infer<typeof updatePoolSchema>;
export type CreateContributionInput = z.infer<typeof createContributionSchema>;

