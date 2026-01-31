/**
 * Admin User Types
 *
 * Type definitions for dashboard users stored in Firestore adminUsers collection.
 * Controls access and permissions for the admin dashboard.
 */

import { Timestamp } from "firebase/firestore";

/**
 * Admin user roles with increasing permissions
 * - viewer: Read-only access to all data
 * - editor: Can create/update advertisers and ads
 * - admin: Full access including archive and user management
 */
export type AdminRole = "admin" | "editor" | "viewer";

/**
 * Admin user account status
 * - active: Can log in and access dashboard
 * - disabled: Access denied, cannot log in
 */
export type AdminUserStatus = "active" | "disabled";

export interface AdminUserMeta {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  updatedBy: string;
}

export interface AdminUser {
  uid: string;
  email: string;
  displayName?: string;
  role: AdminRole;
  status: AdminUserStatus;
  meta: AdminUserMeta;
}

export interface AdminUserDTO {
  uid: string;
  email: string;
  displayName?: string;
  role: AdminRole;
  status: AdminUserStatus;
  meta: {
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string;
  };
}
