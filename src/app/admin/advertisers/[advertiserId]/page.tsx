"use client";

import { useState, use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { AdvertiserDTO } from "@/types/advertiser";
import { useTranslation } from "@/contexts/LanguageContext";
import PageHeader from "@/components/admin/PageHeader";

async function fetchAdvertiser(id: string): Promise<AdvertiserDTO> {
  const res = await fetch(`/api/admin/advertisers/${id}`);
  if (!res.ok) throw new Error("Failed to load advertiser");
  return res.json();
}

async function updateAdvertiser(id: string, data: { name: string; websiteUrl?: string; status: string }) {
  const res = await fetch(`/api/admin/advertisers/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update");
  return res.json();
}

export default function AdvertiserDetailPage({ params }: { params: Promise<{ advertiserId: string }> }) {
  const { t } = useTranslation();
  const { advertiserId } = use(params);
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: advertiser, isLoading } = useQuery<AdvertiserDTO>({
    queryKey: ["advertisers", advertiserId],
    queryFn: () => fetchAdvertiser(advertiserId),
  });

  const mutation = useMutation({
    mutationFn: (data: { name: string; websiteUrl?: string; status: string }) =>
      updateAdvertiser(advertiserId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["advertisers"] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : t("errors.unknownError"));
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      websiteUrl: formData.get("websiteUrl") as string || undefined,
      status: formData.get("status") as string,
    };

    mutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <PageHeader title={t("advertisers.editAdvertiser")} />
        <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
          {t("common.loading")}
        </div>
      </div>
    );
  }

  if (!advertiser) {
    return (
      <div className="flex flex-col min-h-screen">
        <PageHeader title={t("advertisers.editAdvertiser")} />
        <div className="flex-1 flex items-center justify-center text-red-600">
          {t("advertisers.notFound")}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title={t("advertisers.editAdvertiser")} />

      <div className="flex-1 p-6">
        <Link
          href="/admin/advertisers"
          className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("advertisers.backToList")}
        </Link>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 max-w-lg">
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("advertisers.name")} *
            </label>
            <input name="name" required defaultValue={advertiser.name} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white" />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("advertisers.websiteUrl")}
            </label>
            <input name="websiteUrl" type="url" defaultValue={advertiser.websiteUrl || ""} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white" />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t("common.status")}
            </label>
            <select name="status" defaultValue={advertiser.status} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white">
              <option value="active">{t("status.active")}</option>
              <option value="suspended">{t("status.suspended")}</option>
            </select>
          </div>

          <button type="submit" disabled={mutation.isPending} className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {mutation.isPending ? t("common.saving") : t("common.saveChanges")}
          </button>
        </form>
      </div>
    </div>
  );
}
