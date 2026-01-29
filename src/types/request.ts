import { Timestamp } from "firebase/firestore";

export type RequestStatus = "success" | "no_ad" | "error";
export type LanguageCode = "eng" | "jpn";

export interface RequestMeta {
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AdRequest {
  id: string;
  appId: string;
  conversationId: string;
  messageId: string;
  contextText: string;
  language?: LanguageCode;
  decidedAdId?: string;
  status: RequestStatus;
  reason?: string;
  latencyMs?: number;
  sdkVersion?: string;
  userId?: string;
  meta: RequestMeta;
}

export interface CreateRequestInput {
  appId: string;
  conversationId: string;
  messageId: string;
  contextText: string;
  userId?: string;
  sdkVersion?: string;
}

export interface RequestResponse {
  ok: boolean;
  requestId: string | null;
  ad: import("./ad").ResolvedAd | null;
}
