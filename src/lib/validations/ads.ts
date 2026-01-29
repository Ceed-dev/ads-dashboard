import { z } from "zod";
import { httpsUrlSchema, localizedTextSchema, tagsSchema, paginationSchema } from "./common";

export const adStatusSchema = z.enum(["active", "paused", "archived"]);
export const adFormatSchema = z.literal("action_card");

export const createAdSchema = z.object({
  advertiserId: z.string().min(1, "Advertiser ID is required"),
  title: localizedTextSchema,
  description: localizedTextSchema,
  ctaText: localizedTextSchema,
  ctaUrl: httpsUrlSchema,
  tags: tagsSchema,
  status: z.enum(["active", "paused"]).default("paused"),
});

export const updateAdSchema = z.object({
  title: localizedTextSchema.optional(),
  description: localizedTextSchema.optional(),
  ctaText: localizedTextSchema.optional(),
  ctaUrl: httpsUrlSchema.optional(),
  tags: tagsSchema.optional(),
  status: adStatusSchema.optional(),
});

export const listAdsSchema = paginationSchema.extend({
  q: z.string().optional(),
  status: adStatusSchema.optional(),
  advertiserId: z.string().optional(),
  tag: z.string().optional(),
});

// Publish gate validation
export const publishGateSchema = z.object({
  title: z.object({
    eng: z.string().min(1, "English title is required for publishing"),
  }),
  description: z.object({
    eng: z.string().min(1, "English description is required for publishing"),
  }),
  ctaText: z.object({
    eng: z.string().min(1, "English CTA text is required for publishing"),
  }),
  ctaUrl: httpsUrlSchema,
  tags: tagsSchema,
});

// SDK request validation
export const requestInputSchema = z.object({
  appId: z.string().min(1, "App ID is required"),
  conversationId: z.string().min(1, "Conversation ID is required"),
  messageId: z.string().min(1, "Message ID is required"),
  contextText: z.string().min(1, "Context text is required"),
  userId: z.string().optional(),
  sdkVersion: z.string().optional(),
});

// SDK event validation
export const eventInputSchema = z.object({
  type: z.enum(["impression", "click"]),
  adId: z.string().min(1, "Ad ID is required"),
  advertiserId: z.string().min(1, "Advertiser ID is required"),
  requestId: z.string().min(1, "Request ID is required"),
  userId: z.string().optional(),
  conversationId: z.string().optional(),
  appId: z.string().optional(),
});

export type CreateAdInput = z.infer<typeof createAdSchema>;
export type UpdateAdInput = z.infer<typeof updateAdSchema>;
export type ListAdsParams = z.infer<typeof listAdsSchema>;
export type RequestInput = z.infer<typeof requestInputSchema>;
export type EventInput = z.infer<typeof eventInputSchema>;
