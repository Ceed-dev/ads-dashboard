import { Timestamp } from "firebase/firestore";

export type AdStatus = "active" | "paused" | "archived";
export type AdFormat = "action_card";
export type LocaleCode = "eng" | "jpn";
export type LocalizedText = Partial<Record<LocaleCode, string>>;

export interface AdMeta {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  updatedBy: string;
}

export interface Ad {
  id: string;
  advertiserId: string;
  format: AdFormat;
  title: LocalizedText;
  description: LocalizedText;
  ctaText: LocalizedText;
  ctaUrl: string;
  tags: string[];
  status: AdStatus;
  meta: AdMeta;
  search?: {
    titleEngLower: string;
  };
}

export interface AdDTO {
  id: string;
  advertiserId: string;
  advertiserName: string;
  format: AdFormat;
  title: LocalizedText;
  description: LocalizedText;
  ctaText: LocalizedText;
  ctaUrl: string;
  tags: string[];
  status: AdStatus;
  meta: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
  };
}

export interface CreateAdInput {
  advertiserId: string;
  title: LocalizedText;
  description: LocalizedText;
  ctaText: LocalizedText;
  ctaUrl: string;
  tags: string[];
  status?: "active" | "paused";
}

export interface UpdateAdInput {
  title?: LocalizedText;
  description?: LocalizedText;
  ctaText?: LocalizedText;
  ctaUrl?: string;
  tags?: string[];
  status?: AdStatus;
}

export interface ResolvedAd {
  id: string;
  advertiserId: string;
  advertiserName: string;
  format: AdFormat;
  title: string;
  description: string;
  ctaText: string;
  ctaUrl: string;
}
