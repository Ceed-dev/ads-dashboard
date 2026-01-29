import { z } from "zod";

// Tag validation rules (must match matching logic)
// - lowercase only
// - no spaces, no hyphens
// - pattern: ^[a-z0-9_]+$
// - length: 2-32
export const tagSchema = z
  .string()
  .min(2, "Tag must be at least 2 characters")
  .max(32, "Tag must be at most 32 characters")
  .regex(/^[a-z0-9_]+$/, "Tag must contain only lowercase letters, numbers, and underscores");

// Tags array: 1-20 tags
export const tagsSchema = z
  .array(tagSchema)
  .min(1, "At least 1 tag is required")
  .max(20, "Maximum 20 tags allowed")
  .transform((tags) => [...new Set(tags.map((t) => t.toLowerCase().trim()))]);

// URL validation (https only)
export const httpsUrlSchema = z
  .string()
  .url("Must be a valid URL")
  .refine((url) => url.startsWith("https://"), "URL must use HTTPS");

// Optional https URL
export const optionalHttpsUrlSchema = z
  .string()
  .url("Must be a valid URL")
  .refine((url) => url.startsWith("https://"), "URL must use HTTPS")
  .optional()
  .or(z.literal(""));

// Localized text (eng required, jpn optional)
export const localizedTextSchema = z.object({
  eng: z.string().min(1, "English text is required"),
  jpn: z.string().optional(),
});

// Pagination
export const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

// Helper to normalize tags
export function normalizeTags(tags: string[]): string[] {
  return [...new Set(tags.map((t) => t.toLowerCase().trim()))];
}
