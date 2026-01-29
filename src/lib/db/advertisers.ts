import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb, collections } from "@/lib/firebase/admin";
import type { Advertiser, AdvertiserDTO, CreateAdvertiserInput, UpdateAdvertiserInput } from "@/types/advertiser";

function toDTO(doc: FirebaseFirestore.DocumentSnapshot): AdvertiserDTO | null {
  if (!doc.exists) return null;
  const data = doc.data() as Omit<Advertiser, "id">;
  return {
    id: doc.id,
    name: data.name,
    status: data.status,
    websiteUrl: data.websiteUrl,
    meta: {
      createdAt: (data.meta.createdAt as Timestamp).toDate().toISOString(),
      updatedAt: (data.meta.updatedAt as Timestamp).toDate().toISOString(),
      createdBy: data.meta.createdBy,
      updatedBy: data.meta.updatedBy,
    },
  };
}

export async function getAdvertiser(id: string): Promise<AdvertiserDTO | null> {
  const doc = await collections.advertisers.doc(id).get();
  return toDTO(doc);
}

export async function listAdvertisers(params: {
  q?: string;
  status?: "active" | "suspended";
  limit?: number;
  cursor?: string;
}): Promise<{ items: AdvertiserDTO[]; nextCursor?: string }> {
  let query: FirebaseFirestore.Query = collections.advertisers;

  if (params.status) {
    query = query.where("status", "==", params.status);
  }

  if (params.q) {
    const searchLower = params.q.toLowerCase();
    query = query
      .where("search.nameLower", ">=", searchLower)
      .where("search.nameLower", "<=", searchLower + "\uf8ff");
  } else {
    query = query.orderBy("meta.updatedAt", "desc");
  }

  const limit = params.limit || 20;
  query = query.limit(limit + 1);

  if (params.cursor) {
    const cursorDoc = await collections.advertisers.doc(params.cursor).get();
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc);
    }
  }

  const snapshot = await query.get();
  const docs = snapshot.docs;
  const hasMore = docs.length > limit;
  const items = docs.slice(0, limit).map((doc) => toDTO(doc)!);
  const nextCursor = hasMore ? docs[limit - 1].id : undefined;

  return { items, nextCursor };
}

export async function createAdvertiser(
  input: CreateAdvertiserInput,
  actorEmail: string
): Promise<string> {
  const now = FieldValue.serverTimestamp();
  const docRef = collections.advertisers.doc();

  await docRef.set({
    name: input.name,
    status: input.status || "active",
    websiteUrl: input.websiteUrl || null,
    meta: {
      createdAt: now,
      updatedAt: now,
      createdBy: actorEmail,
      updatedBy: actorEmail,
    },
    search: {
      nameLower: input.name.toLowerCase(),
    },
  });

  return docRef.id;
}

export async function updateAdvertiser(
  id: string,
  input: UpdateAdvertiserInput,
  actorEmail: string
): Promise<void> {
  const updates: Record<string, unknown> = {
    "meta.updatedAt": FieldValue.serverTimestamp(),
    "meta.updatedBy": actorEmail,
  };

  if (input.name !== undefined) {
    updates.name = input.name;
    updates["search.nameLower"] = input.name.toLowerCase();
  }
  if (input.status !== undefined) {
    updates.status = input.status;
  }
  if (input.websiteUrl !== undefined) {
    updates.websiteUrl = input.websiteUrl || null;
  }

  await collections.advertisers.doc(id).update(updates);

  // Auto-pause ads if advertiser is suspended
  if (input.status === "suspended") {
    await pauseAdsForAdvertiser(id);
  }
}

async function pauseAdsForAdvertiser(advertiserId: string): Promise<void> {
  const adsSnapshot = await collections.ads
    .where("advertiserId", "==", advertiserId)
    .where("status", "==", "active")
    .get();

  const batch = adminDb.batch();
  adsSnapshot.docs.forEach((doc) => {
    batch.update(doc.ref, { status: "paused" });
  });

  if (!adsSnapshot.empty) {
    await batch.commit();
  }
}
