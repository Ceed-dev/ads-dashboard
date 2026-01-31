import { Timestamp } from "firebase/firestore";

// Event types:
// - impression: Ad was displayed to user
// - click: User clicked the CTA button
// - submit: User submitted a form (lead_gen format)
// - tap: User tapped on a followup question (followup format)
export type EventType = "impression" | "click" | "submit" | "tap";

export interface EventMeta {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Additional data for specific event types
export interface EventData {
  // For submit events: collected form data
  formData?: Record<string, string>;
  // For tap events: which action was triggered
  tapAction?: "expand" | "redirect" | "submit";
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
  eventData?: EventData;
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
  eventData?: EventData;
}

export interface EventResponse {
  success: boolean;
  eventId: string;
}
