/**
 * GET /api/ads/static
 *
 * Page load targeting ad endpoint.
 * Returns a static-format ad based on user history and targeting parameters.
 *
 * Unlike POST /api/requests (conversation context ads), this endpoint:
 * - Uses GET method (no conversation context needed)
 * - Fetches user's past history to determine interests
 * - Only returns static-format ads
 * - Supports device/geo targeting
 */

import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { collections } from "@/lib/firebase/admin";
import { decideStaticAd } from "@/lib/ads/decideStatic";
import type { ResolvedAd } from "@/types/ad";

// Query parameter validation
const staticAdQuerySchema = z.object({
  userId: z.string().min(1, "userId is required"),
  publisherId: z.string().min(1, "publisherId is required"),
  language: z.enum(["eng", "jpn"]).optional(),
  deviceType: z.enum(["desktop", "mobile", "tablet"]).optional(),
  geo: z.string().optional(),
});

export interface StaticAdResponse {
  ok: boolean;
  requestId: string | null;
  ad: ResolvedAd | null;
}

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const params = {
      userId: searchParams.get("userId") || "",
      publisherId: searchParams.get("publisherId") || "",
      language: searchParams.get("language") as "eng" | "jpn" | undefined,
      deviceType: searchParams.get("deviceType") as
        | "desktop"
        | "mobile"
        | "tablet"
        | undefined,
      geo: searchParams.get("geo") || undefined,
    };

    // Validate parameters
    const input = staticAdQuerySchema.parse(params);

    // Decide static ad
    const decision = await decideStaticAd({
      userId: input.userId,
      publisherId: input.publisherId,
      language: input.language,
      deviceType: input.deviceType,
      geo: input.geo,
    });

    // Create request log document
    const docRef = collections.requests.doc();
    const requestDoc = {
      appId: input.publisherId,
      userId: input.userId,
      requestType: "static",
      decidedAdId: decision.ad?.id || null,
      status: decision.ad ? "success" : "no_ad",
      reason: decision.reason || null,
      latencyMs: Date.now() - startTime,
      targeting: {
        language: input.language || null,
        deviceType: input.deviceType || null,
        geo: input.geo || null,
      },
      meta: {
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
    };

    await docRef.set(requestDoc);

    const response: StaticAdResponse = {
      ok: decision.ad !== null,
      requestId: docRef.id,
      ad: decision.ad,
    };

    // Set cache headers for static ads (can be cached briefly)
    return NextResponse.json(response, {
      headers: {
        "Cache-Control": "private, max-age=60", // Cache for 1 minute per user
      },
    });
  } catch (error) {
    console.error("Static ad request error:", error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          ok: false,
          requestId: null,
          ad: null,
          error: error.issues.map((issue) => issue.message).join(", "),
        },
        { status: 400 }
      );
    }

    // Log failed request if possible
    try {
      const docRef = collections.requests.doc();
      await docRef.set({
        requestType: "static",
        status: "error",
        reason: error instanceof Error ? error.message : "Unknown error",
        latencyMs: Date.now() - startTime,
        meta: {
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        },
      });
    } catch {
      // Ignore logging errors
    }

    return NextResponse.json(
      { ok: false, requestId: null, ad: null },
      { status: 500 }
    );
  }
}
