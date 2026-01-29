import { z } from "zod";
import { optionalHttpsUrlSchema, paginationSchema } from "./common";

export const advertiserStatusSchema = z.enum(["active", "suspended"]);

export const createAdvertiserSchema = z.object({
  name: z.string().min(1, "Name is required").max(200, "Name too long"),
  status: advertiserStatusSchema.default("active"),
  websiteUrl: optionalHttpsUrlSchema,
});

export const updateAdvertiserSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  status: advertiserStatusSchema.optional(),
  websiteUrl: optionalHttpsUrlSchema,
});

export const listAdvertisersSchema = paginationSchema.extend({
  q: z.string().optional(),
  status: advertiserStatusSchema.optional(),
});

export type CreateAdvertiserInput = z.infer<typeof createAdvertiserSchema>;
export type UpdateAdvertiserInput = z.infer<typeof updateAdvertiserSchema>;
export type ListAdvertisersParams = z.infer<typeof listAdvertisersSchema>;
