/**
 * Advertiser Types
 *
 * Type definitions for advertiser entities stored in Firestore.
 * Advertisers own ads and can be suspended to pause all their ads.
 */

import { Timestamp } from "firebase/firestore";

/**
 * Advertiser status
 * - active: Can have active ads served
 * - suspended: All ads auto-paused, cannot publish new ads
 */
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
