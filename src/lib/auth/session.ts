import { cookies } from "next/headers";
import { adminAuth, collections } from "@/lib/firebase/admin";
import type { AdminUser } from "@/types/adminUser";

const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || "ceed_admin_session";
const SESSION_EXPIRES_DAYS = parseInt(process.env.SESSION_EXPIRES_DAYS || "5", 10);

export interface SessionUser {
  uid: string;
  email: string;
  displayName?: string;
  role: AdminUser["role"];
}

/**
 * Create session cookie from Firebase ID token
 */
export async function createSession(idToken: string): Promise<void> {
  // Verify the ID token
  const decodedToken = await adminAuth.verifyIdToken(idToken);

  // Check if user exists in adminUsers and is active
  const adminUserDoc = await collections.adminUsers.doc(decodedToken.uid).get();
  if (!adminUserDoc.exists) {
    throw new Error("User not authorized");
  }
  const adminUser = adminUserDoc.data() as AdminUser;
  if (adminUser.status !== "active") {
    throw new Error("User account is disabled");
  }

  // Create session cookie (expires in N days)
  const expiresIn = SESSION_EXPIRES_DAYS * 24 * 60 * 60 * 1000;
  const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

  // Set the cookie
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
    maxAge: expiresIn / 1000,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

/**
 * Verify session and return user info
 */
export async function verifySession(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!sessionCookie) {
      return null;
    }

    // Verify the session cookie
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);

    // Get admin user data
    const adminUserDoc = await collections.adminUsers.doc(decodedClaims.uid).get();
    if (!adminUserDoc.exists) {
      return null;
    }
    const adminUser = adminUserDoc.data() as AdminUser;
    if (adminUser.status !== "active") {
      return null;
    }

    return {
      uid: decodedClaims.uid,
      email: adminUser.email,
      displayName: adminUser.displayName,
      role: adminUser.role,
    };
  } catch {
    return null;
  }
}

/**
 * Clear session cookie
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Get current session user (throws if not authenticated)
 */
export async function requireSession(): Promise<SessionUser> {
  const user = await verifySession();
  if (!user) {
    throw new Error("Not authenticated");
  }
  return user;
}
