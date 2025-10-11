import { z } from "zod";

export const createGroupSchema = z.object({
  name: z
    .string()
    .min(2, "Group name must be at least 2 characters")
    .max(100, "Group name must be less than 100 characters")
    .trim(),
  currency: z
    .string()
    .length(3, "Currency must be a 3-letter code")
    .toUpperCase()
    .default("USD"),
});

export const updateGroupSchema = z.object({
  name: z
    .string()
    .min(2, "Group name must be at least 2 characters")
    .max(100, "Group name must be less than 100 characters")
    .trim()
    .optional(),
  currency: z
    .string()
    .length(3, "Currency must be a 3-letter code")
    .toUpperCase()
    .optional(),
});

export const addMemberSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
  role: z.enum(["owner", "admin", "member"]).default("member"),
  spendCap: z.number().int().positive().optional(),
});

export const updateMemberSchema = z.object({
  role: z.enum(["owner", "admin", "member"]).optional(),
  spendCap: z.number().int().positive().nullable().optional(),
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>;
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type UpdateMemberInput = z.infer<typeof updateMemberSchema>;

