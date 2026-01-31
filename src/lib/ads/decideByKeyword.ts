/**
 * Keyword-Based Ad Decision Logic
 *
 * Decides which ad to serve based on conversation context.
 * This is the primary ad decision mechanism for chat-based integrations.
 *
 * Decision process:
 * 1. Detect language from context text
 * 2. Translate Japanese text to English for matching
 * 3. Extract keywords from context
 * 4. Score ads based on tag matches
 * 5. Return highest-scoring ad (random tie-break)
 */

import { franc } from "franc";
import { collections } from "@/lib/firebase/admin";
import { getActiveAds } from "@/lib/db/ads";
import { translateToEnglish } from "./toEnglish";
import { resolveLocalizedAd } from "./resolveAd";
import type { Ad, AdFormat, ResolvedAd } from "@/types/ad";
import type { LanguageCode } from "@/types/request";

/**
 * Input options for ad decision
 */
export interface DecisionOptions {
  /** Optional array of ad formats to filter by */
  formats?: AdFormat[];
}

export interface DecisionResult {
  ad: ResolvedAd | null;
  language: LanguageCode;
  reason?: string;
}

/**
 * Detect language from text using franc
 * Returns "eng" for English, "jpn" for Japanese, null for unsupported
 */
export function detectLanguage(text: string): LanguageCode | null {
  const detected = franc(text);

  if (detected === "und") return "eng"; // Treat undetermined as English
  if (detected === "eng") return "eng";
  if (detected === "jpn") return "jpn";

  return null; // Unsupported language
}

/**
 * Score an ad against context words
 */
function scoreAd(ad: Ad, contextWords: string[]): number {
  let score = 0;
  for (const tag of ad.tags) {
    if (contextWords.includes(tag)) {
      score++;
    }
  }
  return score;
}

/**
 * Main ad decision logic for keyword-based matching.
 *
 * @param contextText - User message or conversation context
 * @param options - Optional decision options (e.g., formats filter)
 * @returns Decision result with matched ad or rejection reason
 */
export async function decideAd(
  contextText: string,
  options?: DecisionOptions
): Promise<DecisionResult> {
  // 1. Detect language
  const language = detectLanguage(contextText);

  if (!language) {
    return {
      ad: null,
      language: "eng",
      reason: "unsupported_language",
    };
  }

  // 2. Normalize context for matching
  let normalizedContext = contextText.toLowerCase();

  // 3. Translate if Japanese
  if (language === "jpn") {
    try {
      normalizedContext = await translateToEnglish(contextText);
      normalizedContext = normalizedContext.toLowerCase();
    } catch (error) {
      console.error("Translation error:", error);
      // Continue with original text if translation fails
    }
  }

  // 4. Split into words
  const contextWords = normalizedContext.split(/\W+/).filter(Boolean);

  // 5. Get active ads
  let ads = await getActiveAds();

  // 5.1 Filter by formats if specified
  if (options?.formats && options.formats.length > 0) {
    ads = ads.filter((ad) => options.formats!.includes(ad.format));
  }

  if (ads.length === 0) {
    return {
      ad: null,
      language,
      reason: "no_match",
    };
  }

  // 6. Score and rank ads
  const scoredAds = ads.map((ad) => ({
    ad,
    score: scoreAd(ad, contextWords),
  }));

  // Filter ads with score > 0
  const matchedAds = scoredAds.filter((item) => item.score > 0);

  if (matchedAds.length === 0) {
    return {
      ad: null,
      language,
      reason: "no_match",
    };
  }

  // Sort by score descending
  matchedAds.sort((a, b) => b.score - a.score);

  // Get highest score
  const maxScore = matchedAds[0].score;
  const topAds = matchedAds.filter((item) => item.score === maxScore);

  // Random tie-break
  const selectedAd = topAds[Math.floor(Math.random() * topAds.length)].ad;

  // 7. Get advertiser name
  const advertiserDoc = await collections.advertisers.doc(selectedAd.advertiserId).get();
  const advertiserName = advertiserDoc.exists
    ? (advertiserDoc.data()?.name as string) || "Unknown"
    : "Unknown";

  // 8. Resolve localized ad
  const resolvedAd = resolveLocalizedAd(selectedAd, advertiserName, language);

  return {
    ad: resolvedAd,
    language,
  };
}
