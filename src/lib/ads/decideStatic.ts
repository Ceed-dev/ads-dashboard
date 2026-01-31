/**
 * Static Ad Decision Logic
 *
 * Decides which static-format ad to serve for page load targeting.
 * Unlike decideByKeyword (which uses conversation context), this module:
 * - Fetches user's past conversation history
 * - Extracts keywords/interests from history
 * - Matches against static-format ads with targeting parameters
 *
 * Use case: Pre-targeting ads shown on page load without conversation context.
 */

import { collections } from "@/lib/firebase/admin";
import { resolveLocalizedAd } from "./resolveAd";
import type { Ad, AdFormat, ResolvedAd } from "@/types/ad";
import type { LanguageCode } from "@/types/request";

export interface StaticDecisionInput {
  userId: string;
  publisherId: string;
  language?: LanguageCode;
  deviceType?: "desktop" | "mobile" | "tablet";
  geo?: string;
  /**
   * Optional array of ad formats to filter by.
   * Defaults to ["static"] if not specified (preserves original behavior).
   */
  formats?: AdFormat[];
}

export interface StaticDecisionResult {
  ad: ResolvedAd | null;
  reason?: string;
}

/**
 * Get active ads filtered by formats.
 * Defaults to static format only if no formats specified.
 *
 * @param formats - Array of formats to include (defaults to ["static"])
 */
async function getActiveAdsByFormats(formats: AdFormat[] = ["static"]): Promise<Ad[]> {
  // Firestore doesn't support 'in' with multiple where clauses efficiently,
  // so we query all active ads and filter in memory for multiple formats
  if (formats.length === 1) {
    // Optimized single-format query
    const snapshot = await collections.ads
      .where("status", "==", "active")
      .where("format", "==", formats[0])
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Ad[];
  }

  // Multiple formats: query all active and filter
  const snapshot = await collections.ads
    .where("status", "==", "active")
    .get();

  return snapshot.docs
    .map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }) as Ad)
    .filter((ad) => formats.includes(ad.format));
}

/**
 * Extract keywords from user's past conversation history
 */
async function extractUserInterests(userId: string): Promise<string[]> {
  // Get recent requests from this user
  const snapshot = await collections.requests
    .where("userId", "==", userId)
    .where("status", "==", "success")
    .orderBy("meta.createdAt", "desc")
    .limit(50)
    .get();

  if (snapshot.empty) {
    return [];
  }

  // Collect all context texts
  const contextTexts: string[] = [];
  snapshot.docs.forEach((doc) => {
    const data = doc.data();
    if (data.contextText) {
      contextTexts.push(data.contextText);
    }
  });

  // Extract keywords from context texts
  const allWords = contextTexts
    .join(" ")
    .toLowerCase()
    .split(/\W+/)
    .filter((word) => word.length >= 3); // Filter out short words

  // Count word frequency
  const wordFreq: Record<string, number> = {};
  allWords.forEach((word) => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });

  // Get top keywords (appearing 2+ times)
  const keywords = Object.entries(wordFreq)
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);

  return keywords;
}

/**
 * Check if ad matches targeting parameters
 */
function matchesTargeting(
  ad: Ad,
  userKeywords: string[],
  input: StaticDecisionInput
): { matches: boolean; score: number } {
  const targeting = ad.staticConfig?.targetingParams;

  // If no targeting params, ad matches everyone
  if (!targeting) {
    return { matches: true, score: 1 };
  }

  let score = 0;

  // Check device type targeting
  if (targeting.deviceTypes && targeting.deviceTypes.length > 0) {
    if (input.deviceType && !targeting.deviceTypes.includes(input.deviceType)) {
      return { matches: false, score: 0 };
    }
    if (input.deviceType && targeting.deviceTypes.includes(input.deviceType)) {
      score += 1;
    }
  }

  // Check geo targeting
  if (targeting.geo && targeting.geo.length > 0) {
    if (input.geo && !targeting.geo.includes(input.geo)) {
      return { matches: false, score: 0 };
    }
    if (input.geo && targeting.geo.includes(input.geo)) {
      score += 1;
    }
  }

  // Check keyword targeting
  if (targeting.keywords && targeting.keywords.length > 0) {
    const matchedKeywords = targeting.keywords.filter((kw) =>
      userKeywords.includes(kw.toLowerCase())
    );

    // Also check against ad tags
    const matchedTags = ad.tags.filter((tag) =>
      userKeywords.includes(tag.toLowerCase())
    );

    const totalMatches = matchedKeywords.length + matchedTags.length;

    if (totalMatches === 0) {
      // No keyword match, but don't exclude if other targeting matched
      score += 0;
    } else {
      score += totalMatches;
    }
  } else {
    // Check tags if no keyword targeting specified
    const matchedTags = ad.tags.filter((tag) =>
      userKeywords.includes(tag.toLowerCase())
    );
    score += matchedTags.length;
  }

  return { matches: true, score };
}

/**
 * Main static ad decision logic.
 *
 * @param input - Decision input including userId and targeting params
 * @returns Decision result with matched ad or rejection reason
 */
export async function decideStaticAd(
  input: StaticDecisionInput
): Promise<StaticDecisionResult> {
  // 1. Get user interests from history
  const userKeywords = await extractUserInterests(input.userId);

  // 2. Get active ads (filtered by formats, defaults to static only)
  const formats = input.formats && input.formats.length > 0 ? input.formats : ["static"];
  const ads = await getActiveAdsByFormats(formats as AdFormat[]);

  if (ads.length === 0) {
    return {
      ad: null,
      reason: "no_matching_ads",
    };
  }

  // 3. Score and filter ads based on targeting
  const scoredAds = ads
    .map((ad) => {
      const { matches, score } = matchesTargeting(ad, userKeywords, input);
      return { ad, matches, score };
    })
    .filter((item) => item.matches);

  if (scoredAds.length === 0) {
    return {
      ad: null,
      reason: "no_targeting_match",
    };
  }

  // 4. Sort by score descending
  scoredAds.sort((a, b) => b.score - a.score);

  // 5. Get highest score ads for random selection
  const maxScore = scoredAds[0].score;
  const topAds = scoredAds.filter((item) => item.score === maxScore);

  // 6. Random tie-break
  const selectedAd = topAds[Math.floor(Math.random() * topAds.length)].ad;

  // 7. Get advertiser name
  const advertiserDoc = await collections.advertisers
    .doc(selectedAd.advertiserId)
    .get();
  const advertiserName = advertiserDoc.exists
    ? (advertiserDoc.data()?.name as string) || "Unknown"
    : "Unknown";

  // 8. Resolve localized ad
  const resolvedAd = resolveLocalizedAd(
    selectedAd,
    advertiserName,
    input.language || "eng"
  );

  return {
    ad: resolvedAd,
  };
}
