/**
 * Ad Database Operations
 *
 * Firestore CRUD operations for ads collection.
 * All writes update meta timestamps and search indexes.
 */

import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { collections } from "@/lib/firebase/admin";
import type { Ad, AdDTO, CreateAdInput, UpdateAdInput } from "@/types/ad";
import { getAdvertiser } from "./advertisers";

/**
 * Convert Firestore document to AdDTO for API responses.
 * Resolves advertiser name and converts timestamps to ISO strings.
 */
async function toDTO(doc: FirebaseFirestore.DocumentSnapshot): Promise<AdDTO | null> {
  if (!doc.exists) return null;
  const data = doc.data() as Omit<Ad, "id">;
  const advertiser = await getAdvertiser(data.advertiserId);

  const dto: AdDTO = {
    id: doc.id,
    advertiserId: data.advertiserId,
    advertiserName: advertiser?.name || "Unknown",
    format: data.format,
    title: data.title,
    description: data.description,
    ctaText: data.ctaText,
    ctaUrl: data.ctaUrl,
    tags: data.tags,
    status: data.status,
    meta: {
      createdAt: (data.meta.createdAt as Timestamp).toDate().toISOString(),
      updatedAt: (data.meta.updatedAt as Timestamp).toDate().toISOString(),
      createdBy: data.meta.createdBy,
      updatedBy: data.meta.updatedBy,
    },
  };

  // Include format-specific configurations if present
  if (data.leadGenConfig) dto.leadGenConfig = data.leadGenConfig;
  if (data.staticConfig) dto.staticConfig = data.staticConfig;
  if (data.followupConfig) dto.followupConfig = data.followupConfig;

  return dto;
}

export async function getAd(id: string): Promise<AdDTO | null> {
  const doc = await collections.ads.doc(id).get();
  return toDTO(doc);
}

export async function listAds(params: {
  q?: string;
  status?: "active" | "paused" | "archived";
  advertiserId?: string;
  tag?: string;
  limit?: number;
  cursor?: string;
}): Promise<{ items: AdDTO[]; nextCursor?: string }> {
  let query: FirebaseFirestore.Query = collections.ads;

  if (params.advertiserId) {
    query = query.where("advertiserId", "==", params.advertiserId);
  }
  if (params.status) {
    query = query.where("status", "==", params.status);
  }
  if (params.tag) {
    query = query.where("tags", "array-contains", params.tag);
  }

  if (params.q) {
    const searchLower = params.q.toLowerCase();
    query = query
      .where("search.titleEngLower", ">=", searchLower)
      .where("search.titleEngLower", "<=", searchLower + "\uf8ff");
  } else {
    query = query.orderBy("meta.updatedAt", "desc");
  }

  const limit = params.limit || 20;
  query = query.limit(limit + 1);

  if (params.cursor) {
    const cursorDoc = await collections.ads.doc(params.cursor).get();
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc);
    }
  }

  const snapshot = await query.get();
  const docs = snapshot.docs;
  const hasMore = docs.length > limit;
  const items = await Promise.all(docs.slice(0, limit).map((doc) => toDTO(doc)!));
  const nextCursor = hasMore ? docs[limit - 1].id : undefined;

  return { items: items.filter(Boolean) as AdDTO[], nextCursor };
}

export async function createAd(
  input: CreateAdInput,
  actorEmail: string
): Promise<string> {
  const now = FieldValue.serverTimestamp();
  const docRef = collections.ads.doc();
  const format = input.format || "action_card";

  const adData: Record<string, unknown> = {
    advertiserId: input.advertiserId,
    format,
    title: input.title,
    description: input.description,
    ctaText: input.ctaText,
    ctaUrl: input.ctaUrl,
    tags: input.tags,
    status: input.status || "paused",
    meta: {
      createdAt: now,
      updatedAt: now,
      createdBy: actorEmail,
      updatedBy: actorEmail,
    },
    search: {
      titleEngLower: (input.title.eng || "").toLowerCase(),
    },
  };

  // Add format-specific configurations
  if (input.leadGenConfig) adData.leadGenConfig = input.leadGenConfig;
  if (input.staticConfig) adData.staticConfig = input.staticConfig;
  if (input.followupConfig) adData.followupConfig = input.followupConfig;

  await docRef.set(adData);

  return docRef.id;
}

export async function updateAd(
  id: string,
  input: UpdateAdInput,
  actorEmail: string
): Promise<void> {
  const updates: Record<string, unknown> = {
    "meta.updatedAt": FieldValue.serverTimestamp(),
    "meta.updatedBy": actorEmail,
  };

  if (input.format !== undefined) updates.format = input.format;
  if (input.title !== undefined) {
    updates.title = input.title;
    updates["search.titleEngLower"] = (input.title.eng || "").toLowerCase();
  }
  if (input.description !== undefined) updates.description = input.description;
  if (input.ctaText !== undefined) updates.ctaText = input.ctaText;
  if (input.ctaUrl !== undefined) updates.ctaUrl = input.ctaUrl;
  if (input.tags !== undefined) updates.tags = input.tags;
  if (input.status !== undefined) updates.status = input.status;

  // Format-specific configurations
  if (input.leadGenConfig !== undefined) updates.leadGenConfig = input.leadGenConfig;
  if (input.staticConfig !== undefined) updates.staticConfig = input.staticConfig;
  if (input.followupConfig !== undefined) updates.followupConfig = input.followupConfig;

  await collections.ads.doc(id).update(updates);
}

export async function duplicateAd(
  id: string,
  actorEmail: string
): Promise<string> {
  const original = await collections.ads.doc(id).get();
  if (!original.exists) throw new Error("Ad not found");

  const data = original.data() as Omit<Ad, "id">;
  const now = FieldValue.serverTimestamp();
  const docRef = collections.ads.doc();

  await docRef.set({
    ...data,
    status: "paused",
    meta: {
      createdAt: now,
      updatedAt: now,
      createdBy: actorEmail,
      updatedBy: actorEmail,
    },
  });

  return docRef.id;
}

export async function getActiveAds(): Promise<Ad[]> {
  const snapshot = await collections.ads
    .where("status", "==", "active")
    .get();

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Ad[];
}
