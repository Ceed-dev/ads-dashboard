import { NextRequest, NextResponse } from "next/server";
import { requireAnyRole, requireWriteAccess, createAuthError } from "@/lib/auth/requireRole";
import { getAdvertiser, updateAdvertiser } from "@/lib/db/advertisers";
import { logAdvertiserMutation } from "@/lib/db/auditLogs";
import { updateAdvertiserSchema } from "@/lib/validations/advertisers";

interface RouteParams {
  params: Promise<{ advertiserId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await requireAnyRole();

    const { advertiserId } = await params;
    const advertiser = await getAdvertiser(advertiserId);

    if (!advertiser) {
      return NextResponse.json({ error: "Advertiser not found" }, { status: 404 });
    }

    return NextResponse.json(advertiser);
  } catch (error) {
    console.error("Get advertiser error:", error);
    if (error instanceof Error) {
      if (error.message === "Not authenticated") {
        return createAuthError("Not authenticated", 401);
      }
      if (error.message === "Insufficient permissions") {
        return createAuthError("Insufficient permissions", 403);
      }
    }
    return NextResponse.json({ error: "Failed to get advertiser" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireWriteAccess();

    const { advertiserId } = await params;
    const existing = await getAdvertiser(advertiserId);

    if (!existing) {
      return NextResponse.json({ error: "Advertiser not found" }, { status: 404 });
    }

    const body = await request.json();
    const input = updateAdvertiserSchema.parse(body);

    await updateAdvertiser(advertiserId, input, user.email);

    // Determine action type for audit
    const action = input.status === "suspended" ? "advertiser.suspend" : "advertiser.update";

    // Audit log
    await logAdvertiserMutation(
      action,
      user.uid,
      user.email,
      advertiserId,
      existing as unknown as Record<string, unknown>,
      { ...existing, ...input }
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Update advertiser error:", error);
    if (error instanceof Error) {
      if (error.message === "Not authenticated") {
        return createAuthError("Not authenticated", 401);
      }
      if (error.message === "Insufficient permissions") {
        return createAuthError("Insufficient permissions", 403);
      }
    }
    return NextResponse.json({ error: "Failed to update advertiser" }, { status: 500 });
  }
}
