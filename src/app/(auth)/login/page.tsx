"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { signInWithPopup } from "firebase/auth";
import { clientAuth, googleProvider } from "@/lib/firebase/client";
import { useTranslation } from "@/contexts/LanguageContext";

function LoginForm() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Sign in with Google
      const result = await signInWithPopup(clientAuth, googleProvider);
      const idToken = await result.user.getIdToken();

      // Create server session
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create session");
      }

      // Redirect to admin or original destination
      // Use window.location.href for full page reload to ensure session cookie is applied
      const redirect = searchParams.get("redirect") || "/admin";
      window.location.href = redirect;
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err instanceof Error
          ? err.message
          : t("errors.errorOccurred")
      );
      // Sign out from Firebase if session creation failed
      await clientAuth.signOut();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {error && (
        <div className="bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <button
        onClick={handleGoogleSignIn}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
        {isLoading ? t("login.signingIn") : t("login.signInWithGoogle")}
      </button>
    </>
  );
}

export default function LoginPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {t("login.title")}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            {t("login.subtitle")}
          </p>
        </div>

        <Suspense fallback={<div className="text-center dark:text-white">{t("common.loading")}</div>}>
          <LoginForm />
        </Suspense>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          {t("login.authorizedOnly")}
        </p>
      </div>
    </div>
  );
}
