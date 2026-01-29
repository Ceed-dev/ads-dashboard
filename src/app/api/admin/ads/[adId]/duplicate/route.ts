import { NextRequest, NextResponse } from "next/server";
import { requireWriteAccess, createAuthError } from "@/lib/auth/requireRole";
import { getAd, duplicateAd } from "@/lib/db/ads";
import { logAdMutation } from "@/lib/db/auditLogs";

interface RouteParams {
  params: Promise<{ adId: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireWriteAccess();

    const { adId } = await params;
    const existing = await getAd(adId);

    if (!existing) {
      return NextResponse.json({ error: "Ad not found" }, { status: 404 });
    }

    const newId = await duplicateAd(adId, user.email);

    // Audit log
    await logAdMutation(
      "ad.duplicate",
      user.uid,
      user.email,
      newId,
      undefined,
      { sourceAdId: adId, newAdId: newId }
    );

    return NextResponse.json({ id: newId }, { status: 201 });
  } catch (error) {
    console.error("Duplicate ad error:", error);
    if (error instanceof Error) {
      if (error.message === "Not authenticated") {
        return createAuthError("Not authenticated", 401);
      }
      if (error.message === "Insufficient permissions") {
        return createAuthError("Insufficient permissions", 403);
      }
      if (error.message === "Ad not found") {
        return NextResponse.json({ error: "Ad not found" }, { status: 404 });
      }
    }
    return NextResponse.json({ error: "Failed to duplicate ad" }, { status: 500 });
  }
}
