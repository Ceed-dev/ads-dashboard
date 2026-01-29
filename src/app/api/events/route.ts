import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { collections } from "@/lib/firebase/admin";
import { eventInputSchema } from "@/lib/validations/ads";
import type { EventResponse } from "@/types/event";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const input = eventInputSchema.parse(body);

    // Create event document
    const docRef = collections.events.doc();
    await docRef.set({
      type: input.type,
      adId: input.adId,
      advertiserId: input.advertiserId,
      requestId: input.requestId,
      userId: input.userId || null,
      conversationId: input.conversationId || null,
      appId: input.appId || null,
      meta: {
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      },
    });

    const response: EventResponse = {
      success: true,
      eventId: docRef.id,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error("Event error:", error);

    return NextResponse.json(
      { success: false, eventId: "" },
      { status: 500 }
    );
  }
}
