"use client";

import { useState, use, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Copy, Archive } from "lucide-react";
import type { AdDTO } from "@/types/ad";
import type { AdvertiserDTO } from "@/types/advertiser";
import { useTranslation } from "@/contexts/LanguageContext";
import PageHeader from "@/components/admin/PageHeader";

async function fetchAd(id: string): Promise<AdDTO> {
  const res = await fetch(`/api/admin/ads/${id}`);
  if (!res.ok) throw new Error("Failed to load ad");
  return res.json();
}

async function fetchAdvertisers(): Promise<AdvertiserDTO[]> {
  const res = await fetch("/api/admin/advertisers");
  if (!res.ok) throw new Error("Failed to load advertisers");
  const data = await res.json();
  return data.items || [];
}

async function updateAd(id: string, data: Record<string, unknown>) {
  const res = await fetch(`/api/admin/ads/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to update ad");
  }
  return res.json();
}

async function duplicateAd(id: string): Promise<{ id: string }> {
  const res = await fetch(`/api/admin/ads/${id}/duplicate`, { method: "POST" });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Failed to duplicate ad");
  }
  return res.json();
}

export default function AdDetailPage({
  params,
}: {
  params: Promise<{ adId: string }>;
}) {
  const { t } = useTranslation();
  const { adId } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const { data: ad, isLoading: adLoading } = useQuery<AdDTO>({
    queryKey: ["ads", adId],
    queryFn: () => fetchAd(adId),
  });

  const { data: advertisers = [] } = useQuery<AdvertiserDTO[]>({
    queryKey: ["advertisers"],
    queryFn: fetchAdvertisers,
  });

  useEffect(() => {
    if (ad?.tags) {
      setTags(ad.tags);
    }
  }, [ad?.tags]);

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => updateAd(adId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : t("errors.unknownError"));
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: () => duplicateAd(adId),
    onSuccess: ({ id }) => {
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      router.push(`/admin/ads/${id}`);
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : t("errors.unknownError"));
    },
  });

  const addTag = () => {
    const tag = tagInput.toLowerCase().trim();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => setTags(tags.filter((t) => t !== tag));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      advertiserId: formData.get("advertiserId") as string,
      title: { eng: formData.get("titleEng") as string, jpn: formData.get("titleJpn") as string || undefined },
      description: { eng: formData.get("descEng") as string, jpn: formData.get("descJpn") as string || undefined },
      ctaText: { eng: formData.get("ctaEng") as string, jpn: formData.get("ctaJpn") as string || undefined },
      ctaUrl: formData.get("ctaUrl") as string,
      tags,
      status: formData.get("status") as string,
    };

    updateMutation.mutate(data);
  };

  const handleDuplicate = () => {
    duplicateMutation.mutate();
  };

  const handleArchive = () => {
    if (!confirm(t("ads.confirmArchive"))) return;
    updateMutation.mutate({ status: "archived" });
  };

  if (adLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <PageHeader title={t("ads.editAd")} />
        <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
          {t("common.loading")}
        </div>
      </div>
    );
  }

  if (!ad) {
    return (
      <div className="flex flex-col min-h-screen">
        <PageHeader title={t("ads.editAd")} />
        <div className="flex-1 flex items-center justify-center text-red-600">
          {t("ads.notFound")}
        </div>
      </div>
    );
  }

  const isArchived = ad.status === "archived";

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title={t("ads.editAd")}>
        <button
          onClick={handleDuplicate}
          disabled={duplicateMutation.isPending}
          className="inline-flex items-center px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          <Copy className="w-4 h-4 mr-2" />
          {t("common.duplicate")}
        </button>
        {!isArchived && (
          <button
            onClick={handleArchive}
            disabled={updateMutation.isPending}
            className="inline-flex items-center px-4 py-2 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50"
          >
            <Archive className="w-4 h-4 mr-2" />
            {t("common.archive")}
          </button>
        )}
      </PageHeader>

      <div className="flex-1 p-6">
        <Link
          href="/admin/ads"
          className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("ads.backToList")}
        </Link>

        <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {t("common.id")}: {ad.id}
        </div>

        {isArchived && (
          <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300 rounded-lg">
            {t("ads.archivedWarning")}
          </div>
        )}

        <form onSubmit={handleSubmit} key={ad.id} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 max-w-2xl">
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("ads.advertiser")} *</label>
            <select name="advertiserId" required disabled={isArchived} defaultValue={ad.advertiserId} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md disabled:bg-gray-100 dark:disabled:bg-gray-800 dark:bg-gray-800 dark:text-white">
              <option value="">{t("common.select")}</option>
              {advertisers.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("ads.titleEn")} *</label>
              <input name="titleEng" required disabled={isArchived} defaultValue={ad.title.eng} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md disabled:bg-gray-100 dark:disabled:bg-gray-800 dark:bg-gray-800 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("ads.titleJp")}</label>
              <input name="titleJpn" disabled={isArchived} defaultValue={ad.title.jpn || ""} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md disabled:bg-gray-100 dark:disabled:bg-gray-800 dark:bg-gray-800 dark:text-white" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("ads.descriptionEn")} *</label>
              <textarea name="descEng" required disabled={isArchived} rows={3} defaultValue={ad.description.eng} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md disabled:bg-gray-100 dark:disabled:bg-gray-800 dark:bg-gray-800 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("ads.descriptionJp")}</label>
              <textarea name="descJpn" disabled={isArchived} rows={3} defaultValue={ad.description.jpn || ""} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md disabled:bg-gray-100 dark:disabled:bg-gray-800 dark:bg-gray-800 dark:text-white" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("ads.ctaTextEn")} *</label>
              <input name="ctaEng" required disabled={isArchived} defaultValue={ad.ctaText.eng} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md disabled:bg-gray-100 dark:disabled:bg-gray-800 dark:bg-gray-800 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("ads.ctaTextJp")}</label>
              <input name="ctaJpn" disabled={isArchived} defaultValue={ad.ctaText.jpn || ""} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md disabled:bg-gray-100 dark:disabled:bg-gray-800 dark:bg-gray-800 dark:text-white" />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("ads.ctaUrl")} *</label>
            <input name="ctaUrl" type="url" required disabled={isArchived} defaultValue={ad.ctaUrl} placeholder={t("placeholders.httpsUrl")} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md disabled:bg-gray-100 dark:disabled:bg-gray-800 dark:bg-gray-800 dark:text-white" />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("ads.tags")} *</label>
            {!isArchived && (
              <div className="flex gap-2 mb-2">
                <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} placeholder={t("ads.addTag")} className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md dark:bg-gray-800 dark:text-white" />
                <button type="button" onClick={addTag} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 dark:text-white rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">{t("common.add")}</button>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center px-2.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-sm dark:text-white">
                  {tag}
                  {!isArchived && (
                    <button type="button" onClick={() => removeTag(tag)} className="ml-1 text-gray-500 hover:text-gray-700 dark:hover:text-white">×</button>
                  )}
                </span>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("common.status")}</label>
            <select name="status" disabled={isArchived} defaultValue={ad.status} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md disabled:bg-gray-100 dark:disabled:bg-gray-800 dark:bg-gray-800 dark:text-white">
              <option value="paused">{t("status.paused")}</option>
              <option value="active">{t("status.active")}</option>
              {isArchived && <option value="archived">{t("status.archived")}</option>}
            </select>
          </div>

          {!isArchived && (
            <button type="submit" disabled={updateMutation.isPending} className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {updateMutation.isPending ? t("common.saving") : t("common.saveChanges")}
            </button>
          )}

          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-800 text-sm text-gray-500 dark:text-gray-400">
            <p>{t("common.created")}: {new Date(ad.meta.createdAt).toLocaleString()} {t("common.by")} {ad.meta.createdBy}</p>
            <p>{t("common.updated")}: {new Date(ad.meta.updatedAt).toLocaleString()} {t("common.by")} {ad.meta.updatedBy}</p>
          </div>
        </form>
      </div>
    </div>
  );
}
