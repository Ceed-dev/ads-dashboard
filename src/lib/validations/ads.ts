/**
 * Ad Validation Schemas
 *
 * Zod schemas for validating ad-related API inputs.
 * Includes schemas for creating, updating, and listing ads,
 * as well as SDK request/event payloads.
 */

import { z } from "zod";
import { httpsUrlSchema, localizedTextSchema, tagsSchema, paginationSchema } from "./common";

export const adStatusSchema = z.enum(["active", "paused", "archived"]);
export const adFormatSchema = z.enum(["action_card", "lead_gen", "static", "followup"]);

// lead_gen: Email collection form configuration
export const autocompleteTypeSchema = z.enum(["email", "name", "tel", "off"]);

export const leadGenConfigSchema = z.object({
  placeholder: localizedTextSchema,
  submitButtonText: localizedTextSchema,
  autocompleteType: autocompleteTypeSchema,
  successMessage: localizedTextSchema,
});

// static: Page load targeting ad configuration
export const displayPositionSchema = z.enum(["top", "bottom", "inline", "sidebar"]);

export const staticTargetingParamsSchema = z.object({
  keywords: z.array(z.string()).optional(),
  geo: z.array(z.string()).optional(),
  deviceTypes: z.array(z.enum(["desktop", "mobile", "tablet"])).optional(),
});

export const staticConfigSchema = z.object({
  displayPosition: displayPositionSchema,
  targetingParams: staticTargetingParamsSchema.optional(),
});

// followup: Sponsored question format configuration
export const followupTapActionSchema = z.enum(["expand", "redirect", "submit"]);

export const followupConfigSchema = z.object({
  questionText: localizedTextSchema,
  tapAction: followupTapActionSchema,
  tapActionUrl: httpsUrlSchema.optional(),
}).refine(
  (data) => {
    // tapActionUrl is required when tapAction is "redirect"
    if (data.tapAction === "redirect" && !data.tapActionUrl) {
      return false;
    }
    return true;
  },
  { message: "tapActionUrl is required when tapAction is 'redirect'" }
);

export const createAdSchema = z.object({
  advertiserId: z.string().min(1, "Advertiser ID is required"),
  format: adFormatSchema.default("action_card"),
  title: localizedTextSchema,
  description: localizedTextSchema,
  ctaText: localizedTextSchema,
  ctaUrl: httpsUrlSchema,
  tags: tagsSchema,
  status: z.enum(["active", "paused"]).default("paused"),
  // V2 ranking parameters
  cpc: z.number().min(0.01).max(100).optional(),
  baseCTR: z.number().min(0).max(1).optional(),
  // Format-specific configurations
  leadGenConfig: leadGenConfigSchema.optional(),
  staticConfig: staticConfigSchema.optional(),
  followupConfig: followupConfigSchema.optional(),
}).superRefine((data, ctx) => {
  // Validate that the correct config is provided for each format
  if (data.format === "lead_gen" && !data.leadGenConfig) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "leadGenConfig is required for lead_gen format",
      path: ["leadGenConfig"],
    });
  }
  if (data.format === "static" && !data.staticConfig) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "staticConfig is required for static format",
      path: ["staticConfig"],
    });
  }
  if (data.format === "followup" && !data.followupConfig) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "followupConfig is required for followup format",
      path: ["followupConfig"],
    });
  }
});

export const updateAdSchema = z.object({
  format: adFormatSchema.optional(),
  title: localizedTextSchema.optional(),
  description: localizedTextSchema.optional(),
  ctaText: localizedTextSchema.optional(),
  ctaUrl: httpsUrlSchema.optional(),
  tags: tagsSchema.optional(),
  status: adStatusSchema.optional(),
  // V2 ranking parameters
  cpc: z.number().min(0.01).max(100).optional(),
  baseCTR: z.number().min(0).max(1).optional(),
  // Format-specific configurations
  leadGenConfig: leadGenConfigSchema.optional(),
  staticConfig: staticConfigSchema.optional(),
  followupConfig: followupConfigSchema.optional(),
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
  /**
   * Optional array of ad formats to filter by.
   * If not specified, all formats are eligible.
   * Example: ["action_card", "lead_gen"]
   */
  formats: z.array(adFormatSchema).optional(),
});

// SDK event validation
// Event types:
// - impression: Ad was displayed to user
// - click: User clicked the CTA button
// - submit: User submitted a form (lead_gen format)
// - tap: User tapped on a followup question (followup format)
export const eventInputSchema = z.object({
  type: z.enum(["impression", "click", "submit", "tap"]),
  adId: z.string().min(1, "Ad ID is required"),
  advertiserId: z.string().min(1, "Advertiser ID is required"),
  requestId: z.string().min(1, "Request ID is required"),
  userId: z.string().optional(),
  conversationId: z.string().optional(),
  appId: z.string().optional(),
  /**
   * Email submitted via lead_gen form (sent by SDK for submit events)
   */
  submittedEmail: z.string().email().optional(),
  // Additional data for specific event types
  eventData: z.object({
    // For submit events: collected form data
    formData: z.record(z.string(), z.string()).optional(),
    // For tap events: which action was triggered
    tapAction: z.enum(["expand", "redirect", "submit"]).optional(),
  }).optional(),
});

export type CreateAdInput = z.infer<typeof createAdSchema>;
export type UpdateAdInput = z.infer<typeof updateAdSchema>;
export type ListAdsParams = z.infer<typeof listAdsSchema>;
export type RequestInput = z.infer<typeof requestInputSchema>;
export type EventInput = z.infer<typeof eventInputSchema>;
