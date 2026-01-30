import { NextRequest, NextResponse } from "next/server";
import { requireAnyRole, requireWriteAccess, createAuthError } from "@/lib/auth/requireRole";
import { getAd, updateAd } from "@/lib/db/ads";
import { getAdvertiser } from "@/lib/db/advertisers";
import { logAdMutation } from "@/lib/db/auditLogs";
import { updateAdSchema, publishGateSchema } from "@/lib/validations/ads";

interface RouteParams {
  params: Promise<{ adId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAnyRole();

    const { adId } = await params;
    const ad = await getAd(adId);

    if (!ad) {
      return NextResponse.json({ error: "Ad not found" }, { status: 404 });
    }

    return NextResponse.json(ad);
  } catch (error) {
    console.error("Get ad error:", error);
    if (error instanceof Error) {
      if (error.message === "Not authenticated") {
        return createAuthError("Not authenticated", 401);
      }
      if (error.message === "Insufficient permissions") {
        return createAuthError("Insufficient permissions", 403);
      }
    }
    return NextResponse.json({ error: "Failed to get ad" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireWriteAccess();

    const { adId } = await params;
    const existing = await getAd(adId);

    if (!existing) {
      return NextResponse.json({ error: "Ad not found" }, { status: 404 });
    }

    // Reject edits to archived ads
    if (existing.status === "archived") {
      return NextResponse.json(
        { error: "Cannot edit archived ads" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parseResult = updateAdSchema.safeParse(body);
    if (!parseResult.success) {
      console.error("Validation error:", parseResult.error.issues);
      return NextResponse.json(
        { error: "Validation failed", details: parseResult.error.issues },
        { status: 400 }
      );
    }
    const input = parseResult.data;

    // Publish gate check if setting to active
    if (input.status === "active") {
      const advertiser = await getAdvertiser(existing.advertiserId);
      if (!advertiser || advertiser.status !== "active") {
        return NextResponse.json(
          { error: "Cannot publish ad: advertiser is suspended" },
          { status: 400 }
        );
      }

      const mergedAd = {
        title: input.title || existing.title,
        description: input.description || existing.description,
        ctaText: input.ctaText || existing.ctaText,
        ctaUrl: input.ctaUrl || existing.ctaUrl,
        tags: input.tags || existing.tags,
      };

      const publishCheck = publishGateSchema.safeParse(mergedAd);

      if (!publishCheck.success) {
        return NextResponse.json(
          { error: "Publish gate failed", details: publishCheck.error.issues },
          { status: 400 }
        );
      }
    }

    await updateAd(adId, input, user.email);

    // Determine action type for audit
    let action: "ad.update" | "ad.publish" | "ad.pause" | "ad.archive" = "ad.update";
    if (input.status === "active" && existing.status !== "active") action = "ad.publish";
    else if (input.status === "paused" && existing.status !== "paused") action = "ad.pause";
    else if (input.status === "archived") action = "ad.archive";

    // Audit log (convert to plain objects to avoid Timestamp serialization issues)
    try {
      await logAdMutation(
        action,
        user.uid,
        user.email,
        adId,
        JSON.parse(JSON.stringify(existing)),
        JSON.parse(JSON.stringify({ ...existing, ...input }))
      );
    } catch (auditError) {
      console.error("Audit log error (non-fatal):", auditError);
      // Continue even if audit log fails
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Update ad error:", error);
    if (error instanceof Error) {
      if (error.message === "Not authenticated") {
        return createAuthError("Not authenticated", 401);
      }
      if (error.message === "Insufficient permissions") {
        return createAuthError("Insufficient permissions", 403);
      }
    }
    return NextResponse.json({ error: "Failed to update ad" }, { status: 500 });
  }
}
