import { Timestamp } from "firebase/firestore";

export type AdminRole = "admin" | "editor" | "viewer";
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
