import { NextRequest, NextResponse } from "next/server";
import { requireAnyRole, requireWriteAccess, createAuthError } from "@/lib/auth/requireRole";
import { listAds, createAd } from "@/lib/db/ads";
import { getAdvertiser } from "@/lib/db/advertisers";
import { logAdMutation } from "@/lib/db/auditLogs";
import { listAdsSchema, createAdSchema, publishGateSchema } from "@/lib/validations/ads";

export async function GET(request: NextRequest) {
  try {
    await requireAnyRole();

    const { searchParams } = new URL(request.url);
    const params = listAdsSchema.parse({
      q: searchParams.get("q") || undefined,
      status: searchParams.get("status") || undefined,
      advertiserId: searchParams.get("advertiserId") || undefined,
      tag: searchParams.get("tag") || undefined,
      limit: searchParams.get("limit") || undefined,
      cursor: searchParams.get("cursor") || undefined,
    });

    const result = await listAds(params);

    return NextResponse.json(result);
  } catch (error) {
    console.error("List ads error:", error);
    if (error instanceof Error) {
      if (error.message === "Not authenticated") {
        return createAuthError("Not authenticated", 401);
      }
      if (error.message === "Insufficient permissions") {
        return createAuthError("Insufficient permissions", 403);
      }
    }
    return NextResponse.json({ error: "Failed to list ads" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireWriteAccess();

    const body = await request.json();
    const input = createAdSchema.parse(body);

    // Verify advertiser exists and is active (if creating as active)
    const advertiser = await getAdvertiser(input.advertiserId);
    if (!advertiser) {
      return NextResponse.json({ error: "Advertiser not found" }, { status: 400 });
    }

    // Publish gate check if creating as active
    if (input.status === "active") {
      if (advertiser.status !== "active") {
        return NextResponse.json(
          { error: "Cannot publish ad: advertiser is suspended" },
          { status: 400 }
        );
      }

      // Validate publish requirements
      const publishCheck = publishGateSchema.safeParse({
        title: input.title,
        description: input.description,
        ctaText: input.ctaText,
        ctaUrl: input.ctaUrl,
        tags: input.tags,
      });

      if (!publishCheck.success) {
        return NextResponse.json(
          { error: "Publish gate failed", details: publishCheck.error.issues },
          { status: 400 }
        );
      }
    }

    const id = await createAd(input, user.email);

    // Audit log
    await logAdMutation(
      "ad.create",
      user.uid,
      user.email,
      id,
      undefined,
      { ...input, id }
    );

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error("Create ad error:", error);
    if (error instanceof Error) {
      if (error.message === "Not authenticated") {
        return createAuthError("Not authenticated", 401);
      }
      if (error.message === "Insufficient permissions") {
        return createAuthError("Insufficient permissions", 403);
      }
    }
    return NextResponse.json({ error: "Failed to create ad" }, { status: 500 });
  }
}
