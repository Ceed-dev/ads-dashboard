/**
 * Ad Types
 *
 * Core type definitions for ad entities stored in Firestore.
 * These types define the structure for creating, updating, and serving ads.
 */

import { Timestamp } from "firebase/firestore";

/**
 * Ad lifecycle status
 * - active: Eligible for serving to users
 * - paused: Temporarily disabled, can be reactivated
 * - archived: Permanently disabled, read-only in UI
 */
export type AdStatus = "active" | "paused" | "archived";

/**
 * Supported ad formats
 * - action_card: Standard CTA card with title, description, and button
 * - lead_gen: Email collection form
 * - static: Page load targeting ad
 * - followup: Sponsored question format
 */
export type AdFormat = "action_card" | "lead_gen" | "static" | "followup";

/** Supported locale codes for content localization */
export type LocaleCode = "eng" | "jpn";

/** Localized text with optional translations per locale */
export type LocalizedText = Partial<Record<LocaleCode, string>>;

/* ============================================================================
 * Format-Specific Configurations
 * ============================================================================ */

/**
 * Autocomplete type for lead_gen form inputs.
 * Maps to HTML autocomplete attribute values.
 */
export type AutocompleteType = "email" | "name" | "tel" | "off";

/**
 * Configuration for lead_gen (email collection) format.
 * Defines the form UI and success messaging.
 */
export interface LeadGenConfig {
  /** Placeholder text for the input field */
  placeholder: LocalizedText;
  /** Text displayed on the submit button */
  submitButtonText: LocalizedText;
  /** HTML autocomplete attribute for the input */
  autocompleteType: AutocompleteType;
  /** Message shown after successful form submission */
  successMessage: LocalizedText;
}

/**
 * Display position for static format ads.
 * Determines where the ad appears on the page.
 */
export type DisplayPosition = "top" | "bottom" | "inline" | "sidebar";

/**
 * Targeting parameters for static format ads.
 * Used to filter which users see the ad.
 */
export interface StaticTargetingParams {
  /** Keywords to match against user interests */
  keywords?: string[];
  /** Geographic regions to target (e.g., "US", "JP") */
  geo?: string[];
  /** Device types to target */
  deviceTypes?: ("desktop" | "mobile" | "tablet")[];
}

/**
 * Configuration for static (page load targeting) format.
 * Defines display position and targeting criteria.
 */
export interface StaticConfig {
  /** Where the ad should be displayed on the page */
  displayPosition: DisplayPosition;
  /** Optional targeting parameters for audience filtering */
  targetingParams?: StaticTargetingParams;
}

/**
 * Tap action type for followup format.
 * Determines what happens when user taps the question card.
 */
export type FollowupTapAction = "expand" | "redirect" | "submit";

/**
 * Configuration for followup (sponsored question) format.
 * Defines the question text and tap behavior.
 */
export interface FollowupConfig {
  /** The sponsored question text to display */
  questionText: LocalizedText;
  /** Action triggered when user taps the card */
  tapAction: FollowupTapAction;
  /** Redirect URL (required when tapAction is "redirect") */
  tapActionUrl?: string;
}

/* ============================================================================
 * Core Ad Types
 * ============================================================================ */

/**
 * Metadata fields for ad audit trail.
 * Automatically managed by the system on create/update.
 */
export interface AdMeta {
  /** Timestamp when the ad was created */
  createdAt: Timestamp;
  /** Timestamp when the ad was last updated */
  updatedAt: Timestamp;
  /** Email of the user who created the ad */
  createdBy: string;
  /** Email of the user who last updated the ad */
  updatedBy: string;
}

/**
 * Core Ad entity stored in Firestore.
 * Represents a single advertisement with all its configurations.
 */
export interface Ad {
  /** Unique identifier (Firestore document ID) */
  id: string;
  /** Reference to the advertiser who owns this ad */
  advertiserId: string;
  /** Ad format type determining display behavior */
  format: AdFormat;
  /** Localized ad title (English required) */
  title: LocalizedText;
  /** Localized ad description (English required) */
  description: LocalizedText;
  /** Localized call-to-action button text */
  ctaText: LocalizedText;
  /** Destination URL when CTA is clicked (must be HTTPS) */
  ctaUrl: string;
  /** Keyword tags for ad matching (lowercase, alphanumeric) */
  tags: string[];
  /** Current lifecycle status */
  status: AdStatus;
  /** Audit trail metadata */
  meta: AdMeta;
  /** Search index fields (auto-generated) */
  search?: {
    titleEngLower: string;
  };
  /** Configuration for lead_gen format */
  leadGenConfig?: LeadGenConfig;
  /** Configuration for static format */
  staticConfig?: StaticConfig;
  /** Configuration for followup format */
  followupConfig?: FollowupConfig;
}

/**
 * Ad Data Transfer Object for API responses.
 * Includes resolved advertiser name and ISO string timestamps.
 */
export interface AdDTO {
  id: string;
  advertiserId: string;
  /** Resolved advertiser display name */
  advertiserName: string;
  format: AdFormat;
  title: LocalizedText;
  description: LocalizedText;
  ctaText: LocalizedText;
  ctaUrl: string;
  tags: string[];
  status: AdStatus;
  /** Metadata with ISO 8601 timestamp strings */
  meta: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
  };
  leadGenConfig?: LeadGenConfig;
  staticConfig?: StaticConfig;
  followupConfig?: FollowupConfig;
}

/* ============================================================================
 * API Input/Output Types
 * ============================================================================ */

/**
 * Input for creating a new ad.
 * Format-specific config must be provided based on format type.
 */
export interface CreateAdInput {
  advertiserId: string;
  /** Ad format (defaults to "action_card" if not specified) */
  format?: AdFormat;
  title: LocalizedText;
  description: LocalizedText;
  ctaText: LocalizedText;
  ctaUrl: string;
  tags: string[];
  /** Initial status (defaults to "paused") */
  status?: "active" | "paused";
  /** Required when format is "lead_gen" */
  leadGenConfig?: LeadGenConfig;
  /** Required when format is "static" */
  staticConfig?: StaticConfig;
  /** Required when format is "followup" */
  followupConfig?: FollowupConfig;
}

/**
 * Input for updating an existing ad.
 * All fields are optional - only provided fields are updated.
 */
export interface UpdateAdInput {
  format?: AdFormat;
  title?: LocalizedText;
  description?: LocalizedText;
  ctaText?: LocalizedText;
  ctaUrl?: string;
  tags?: string[];
  status?: AdStatus;
  leadGenConfig?: LeadGenConfig;
  staticConfig?: StaticConfig;
  followupConfig?: FollowupConfig;
}

/**
 * Client-ready ad payload returned from ad request APIs.
 * All localized fields are resolved to single strings based on detected language.
 * This is what the SDK receives and renders.
 */
export interface ResolvedAd {
  id: string;
  advertiserId: string;
  advertiserName: string;
  format: AdFormat;
  /** Resolved title string for detected language */
  title: string;
  /** Resolved description string for detected language */
  description: string;
  /** Resolved CTA button text for detected language */
  ctaText: string;
  ctaUrl: string;
  /** Resolved lead_gen config (if format is "lead_gen") */
  leadGenConfig?: {
    placeholder: string;
    submitButtonText: string;
    autocompleteType: AutocompleteType;
    successMessage: string;
  };
  /** Static config (no localization needed) */
  staticConfig?: StaticConfig;
  /** Resolved followup config (if format is "followup") */
  followupConfig?: {
    questionText: string;
    tapAction: FollowupTapAction;
    tapActionUrl?: string;
  };
}
