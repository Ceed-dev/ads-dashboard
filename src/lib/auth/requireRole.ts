import { verifySession, type SessionUser } from "./session";
import type { AdminRole } from "@/types/adminUser";

export type Permission = "read" | "write" | "admin";

const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  viewer: ["read"],
  editor: ["read", "write"],
  admin: ["read", "write", "admin"],
};

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: AdminRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Check if user can perform write operations
 */
export function canWrite(role: AdminRole): boolean {
  return hasPermission(role, "write");
}

/**
 * Check if user has admin privileges
 */
export function isAdmin(role: AdminRole): boolean {
  return hasPermission(role, "admin");
}

/**
 * Require specific role(s) for an API route
 * Returns the session user if authorized, throws otherwise
 */
export async function requireRole(
  allowedRoles: AdminRole | AdminRole[]
): Promise<SessionUser> {
  const user = await verifySession();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  if (!roles.includes(user.role)) {
    throw new Error("Insufficient permissions");
  }

  return user;
}

/**
 * Require write permission (editor or admin)
 */
export async function requireWriteAccess(): Promise<SessionUser> {
  return requireRole(["editor", "admin"]);
}

/**
 * Require admin role
 */
export async function requireAdminAccess(): Promise<SessionUser> {
  return requireRole("admin");
}

/**
 * Require any authenticated user (viewer, editor, or admin)
 */
export async function requireAnyRole(): Promise<SessionUser> {
  return requireRole(["viewer", "editor", "admin"]);
}

/**
 * Helper to create consistent error responses
 */
export function createAuthError(message: string, status: number = 401) {
  return Response.json({ error: message }, { status });
}
