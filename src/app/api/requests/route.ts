import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { collections } from "@/lib/firebase/admin";
import { decideAd } from "@/lib/ads/decideByKeyword";
import { requestInputSchema } from "@/lib/validations/ads";
import type { RequestResponse } from "@/types/request";

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const input = requestInputSchema.parse(body);

    // Decide ad based on context
    const decision = await decideAd(input.contextText);

    // Create request document
    const docRef = collections.requests.doc();
    const requestDoc = {
      appId: input.appId,
      conversationId: input.conversationId,
      messageId: input.messageId,
      contextText: input.contextText,
      language: decision.language,
      decidedAdId: decision.ad?.id || null,
      status: decision.ad ? "success" : "no_ad",
      reason: decision.reason || null,
      latencyMs: Date.now() - startTime,
      sdkVersion: input.sdkVersion || null,
      userId: input.userId || null,
      meta: {
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
    };

    await docRef.set(requestDoc);

    const response: RequestResponse = {
      ok: decision.ad !== null,
      requestId: docRef.id,
      ad: decision.ad,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Request error:", error);

    // Log failed request if possible
    try {
      const docRef = collections.requests.doc();
      await docRef.set({
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
