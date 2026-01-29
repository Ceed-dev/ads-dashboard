import { Timestamp } from "firebase/firestore";

export type EventType = "impression" | "click";

export interface EventMeta {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AdEvent {
  id: string;
  type: EventType;
  adId: string;
  advertiserId: string;
  requestId: string;
  userId?: string;
  conversationId?: string;
  appId?: string;
  meta: EventMeta;
}

export interface CreateEventInput {
  type: EventType;
  adId: string;
  advertiserId: string;
  requestId: string;
  userId?: string;
  conversationId?: string;
  appId?: string;
}

export interface EventResponse {
  success: boolean;
  eventId: string;
}
