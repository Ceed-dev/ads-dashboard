import { franc } from "franc";
import { collections } from "@/lib/firebase/admin";
import { getActiveAds } from "@/lib/db/ads";
import { translateToEnglish } from "./toEnglish";
import type { Ad, ResolvedAd } from "@/types/ad";
import type { LanguageCode } from "@/types/request";

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
 * Resolve localized fields based on language
 */
function resolveLocalizedAd(
  ad: Ad,
  advertiserName: string,
  language: LanguageCode
): ResolvedAd {
  const getLocalized = (field: { eng?: string; jpn?: string }): string => {
    if (language === "jpn" && field.jpn) return field.jpn;
    return field.eng || "";
  };

  return {
    id: ad.id,
    advertiserId: ad.advertiserId,
    advertiserName,
    format: ad.format,
    title: getLocalized(ad.title),
    description: getLocalized(ad.description),
    ctaText: getLocalized(ad.ctaText),
    ctaUrl: ad.ctaUrl,
  };
}

/**
 * Main ad decision logic
 */
export async function decideAd(contextText: string): Promise<DecisionResult> {
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
  const ads = await getActiveAds();

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
