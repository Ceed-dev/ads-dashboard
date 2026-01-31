/**
 * Ad Resolution Utilities
 *
 * Shared utilities for resolving ads to client-ready format.
 * Used by both keyword-based and static ad decision logic.
 */

import type { Ad, ResolvedAd, LocaleCode } from "@/types/ad";
import type { LanguageCode } from "@/types/request";

/**
 * Helper type for localized text fields
 */
type LocalizedField = Partial<Record<LocaleCode, string>>;

/**
 * Get localized text value based on language preference.
 * Falls back to English if the requested language is not available.
 *
 * @param field - Localized text object with optional eng/jpn values
 * @param language - Preferred language code
 * @returns Resolved string value
 */
export function getLocalizedValue(
  field: LocalizedField,
  language: LanguageCode
): string {
  if (language === "jpn" && field.jpn) return field.jpn;
  return field.eng || "";
}

/**
 * Resolve an Ad entity to a client-ready ResolvedAd format.
 * Handles localization of all text fields based on detected language.
 *
 * @param ad - Raw ad entity from database
 * @param advertiserName - Resolved advertiser display name
 * @param language - Language to use for localized fields (defaults to "eng")
 * @returns ResolvedAd ready for client consumption
 */
export function resolveLocalizedAd(
  ad: Ad,
  advertiserName: string,
  language: LanguageCode = "eng"
): ResolvedAd {
  const getLocalized = (field: LocalizedField): string =>
    getLocalizedValue(field, language);

  const resolved: ResolvedAd = {
    id: ad.id,
    advertiserId: ad.advertiserId,
    advertiserName,
    format: ad.format,
    title: getLocalized(ad.title),
    description: getLocalized(ad.description),
    ctaText: getLocalized(ad.ctaText),
    ctaUrl: ad.ctaUrl,
  };

  // Resolve format-specific configurations
  if (ad.format === "lead_gen" && ad.leadGenConfig) {
    resolved.leadGenConfig = {
      placeholder: getLocalized(ad.leadGenConfig.placeholder),
      submitButtonText: getLocalized(ad.leadGenConfig.submitButtonText),
      autocompleteType: ad.leadGenConfig.autocompleteType,
      successMessage: getLocalized(ad.leadGenConfig.successMessage),
    };
  }

  if (ad.format === "static" && ad.staticConfig) {
    resolved.staticConfig = ad.staticConfig;
  }

  if (ad.format === "followup" && ad.followupConfig) {
    resolved.followupConfig = {
      questionText: getLocalized(ad.followupConfig.questionText),
      tapAction: ad.followupConfig.tapAction,
      tapActionUrl: ad.followupConfig.tapActionUrl,
    };
  }

  return resolved;
}
