import { Timestamp } from "firebase/firestore";

export type AdvertiserStatus = "active" | "suspended";

export interface AdvertiserMeta {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string; // email
  updatedBy: string; // email
}

export interface Advertiser {
  id: string;
  name: string;
  status: AdvertiserStatus;
  websiteUrl?: string;
  meta: AdvertiserMeta;
  search?: {
    nameLower: string;
  };
}

export interface AdvertiserDTO {
  id: string;
  name: string;
  status: AdvertiserStatus;
  websiteUrl?: string;
  meta: {
    createdAt: string; // ISO string for API
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
  };
}

export interface CreateAdvertiserInput {
  name: string;
  status?: AdvertiserStatus;
  websiteUrl?: string;
}

export interface UpdateAdvertiserInput {
  name?: string;
  status?: AdvertiserStatus;
  websiteUrl?: string;
}
