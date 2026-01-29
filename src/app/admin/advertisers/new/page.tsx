"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useTranslation } from "@/contexts/LanguageContext";

export default function NewAdvertiserPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      websiteUrl: formData.get("websiteUrl") as string || undefined,
      status: formData.get("status") as string,
    };

    try {
      const res = await fetch("/api/admin/advertisers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || t("errors.failedToCreateAdvertiser"));
      }

      const { id } = await res.json();
      router.push(`/admin/advertisers/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.unknownError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Link href="/admin/advertisers" className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t("advertisers.backToList")}
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {t("advertisers.newAdvertiser")}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 max-w-lg">
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-md">{error}</div>
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t("advertisers.name")} *
          </label>
          <input name="name" required className="w-full px-3 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t("advertisers.websiteUrl")}
          </label>
          <input name="websiteUrl" type="url" placeholder={t("placeholders.httpsUrl")} className="w-full px-3 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white" />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t("common.status")}
          </label>
          <select name="status" defaultValue="active" className="w-full px-3 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white">
            <option value="active">{t("status.active")}</option>
            <option value="suspended">{t("status.suspended")}</option>
          </select>
        </div>

        <button type="submit" disabled={loading} className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
          {loading ? t("common.creating") : t("advertisers.createAdvertiser")}
        </button>
      </form>
    </div>
  );
}
