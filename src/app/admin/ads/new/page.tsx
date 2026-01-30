"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { AdvertiserDTO } from "@/types/advertiser";
import { useTranslation } from "@/contexts/LanguageContext";
import PageHeader from "@/components/admin/PageHeader";

async function fetchActiveAdvertisers(): Promise<AdvertiserDTO[]> {
  const res = await fetch("/api/admin/advertisers?status=active");
  if (!res.ok) throw new Error("Failed to load advertisers");
  const data = await res.json();
  return data.items || [];
}

export default function NewAdPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const { data: advertisers = [] } = useQuery<AdvertiserDTO[]>({
    queryKey: ["advertisers", { status: "active" }],
    queryFn: fetchActiveAdvertisers,
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
    setLoading(true);
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

    try {
      const res = await fetch("/api/admin/ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || t("errors.failedToCreateAd"));
      }

      const { id } = await res.json();
      queryClient.invalidateQueries({ queryKey: ["ads"] });
      router.push(`/admin/ads/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.unknownError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader title={t("ads.newAd")} />

      <div className="flex-1 p-6">
        <Link
          href="/admin/ads"
          className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t("ads.backToList")}
        </Link>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 max-w-2xl">
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("ads.advertiser")} *</label>
            <select name="advertiserId" required className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md dark:bg-gray-800 dark:text-white">
              <option value="">{t("common.select")}</option>
              {advertisers.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("ads.titleEn")} *</label>
              <input name="titleEng" required className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md dark:bg-gray-800 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("ads.titleJp")}</label>
              <input name="titleJpn" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md dark:bg-gray-800 dark:text-white" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("ads.descriptionEn")} *</label>
              <textarea name="descEng" required rows={3} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md dark:bg-gray-800 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("ads.descriptionJp")}</label>
              <textarea name="descJpn" rows={3} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md dark:bg-gray-800 dark:text-white" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("ads.ctaTextEn")} *</label>
              <input name="ctaEng" required className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md dark:bg-gray-800 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("ads.ctaTextJp")}</label>
              <input name="ctaJpn" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md dark:bg-gray-800 dark:text-white" />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("ads.ctaUrl")} *</label>
            <input name="ctaUrl" type="url" required placeholder={t("placeholders.httpsUrl")} className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md dark:bg-gray-800 dark:text-white" />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("ads.tags")} *</label>
            <div className="flex gap-2 mb-2">
              <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())} placeholder={t("ads.addTag")} className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md dark:bg-gray-800 dark:text-white" />
              <button type="button" onClick={addTag} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 dark:text-white rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">{t("common.add")}</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center px-2.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-sm dark:text-white">
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="ml-1 text-gray-500 hover:text-gray-700 dark:hover:text-white">×</button>
                </span>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t("common.status")}</label>
            <select name="status" defaultValue="paused" className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md dark:bg-gray-800 dark:text-white">
              <option value="paused">{t("status.paused")}</option>
              <option value="active">{t("status.active")}</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {loading ? t("common.creating") : t("ads.createAd")}
          </button>
        </form>
      </div>
    </div>
  );
}
