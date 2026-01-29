import { NextRequest, NextResponse } from "next/server";
import { requireAnyRole, requireWriteAccess, createAuthError } from "@/lib/auth/requireRole";
import { listAdvertisers, createAdvertiser } from "@/lib/db/advertisers";
import { logAdvertiserMutation } from "@/lib/db/auditLogs";
import { listAdvertisersSchema, createAdvertiserSchema } from "@/lib/validations/advertisers";

export async function GET(request: NextRequest) {
  try {
    const user = await requireAnyRole();

    const { searchParams } = new URL(request.url);
    const params = listAdvertisersSchema.parse({
      q: searchParams.get("q") || undefined,
      status: searchParams.get("status") || undefined,
      limit: searchParams.get("limit") || undefined,
      cursor: searchParams.get("cursor") || undefined,
    });

    const result = await listAdvertisers(params);

    return NextResponse.json(result);
  } catch (error) {
    console.error("List advertisers error:", error);
    if (error instanceof Error) {
      if (error.message === "Not authenticated") {
        return createAuthError("Not authenticated", 401);
      }
      if (error.message === "Insufficient permissions") {
        return createAuthError("Insufficient permissions", 403);
      }
    }
    return NextResponse.json({ error: "Failed to list advertisers" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireWriteAccess();

    const body = await request.json();
    const input = createAdvertiserSchema.parse(body);

    const id = await createAdvertiser(input, user.email);

    // Audit log
    await logAdvertiserMutation(
      "advertiser.create",
      user.uid,
      user.email,
      id,
      undefined,
      { ...input, id }
    );

    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error("Create advertiser error:", error);
    if (error instanceof Error) {
      if (error.message === "Not authenticated") {
        return createAuthError("Not authenticated", 401);
      }
      if (error.message === "Insufficient permissions") {
        return createAuthError("Insufficient permissions", 403);
      }
    }
    return NextResponse.json({ error: "Failed to create advertiser" }, { status: 500 });
  }
}
