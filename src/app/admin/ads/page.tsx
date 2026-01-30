"use client";

import { useState, useDeferredValue } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Plus, Search, ChevronRight } from "lucide-react";
import type { AdDTO } from "@/types/ad";
import { useTranslation } from "@/contexts/LanguageContext";
import PageHeader from "@/components/admin/PageHeader";

async function fetchAds(params: { search: string; status: string }) {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set("q", params.search);
  if (params.status) searchParams.set("status", params.status);

  const res = await fetch(`/api/admin/ads?${searchParams}`);
  if (!res.ok) throw new Error("Failed to fetch ads");
  const data = await res.json();
  return data.items || [];
}

export default function AdsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const deferredSearch = useDeferredValue(search);

  const { data: ads = [], isLoading } = useQuery<AdDTO[]>({
    queryKey: ["ads", { search: deferredSearch, status: statusFilter }],
    queryFn: () => fetchAds({ search: deferredSearch, status: statusFilter }),
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-500 text-white";
      case "paused": return "bg-yellow-500 text-white";
      case "archived": return "bg-gray-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title={t("ads.title")}
        description={t("ads.description")}
      >
        <Link
          href="/admin/ads/new"
          className="inline-flex items-center px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("ads.newAd")}
        </Link>
      </PageHeader>

      <div className="flex-1 p-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t("ads.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            >
              <option value="">{t("common.allStatus")}</option>
              <option value="active">{t("status.active")}</option>
              <option value="paused">{t("status.paused")}</option>
              <option value="archived">{t("status.archived")}</option>
            </select>
          </div>

          {isLoading ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">{t("common.loading")}</div>
          ) : ads.length === 0 ? (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">{t("ads.noResults")}</div>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-800">
              {ads.map((ad) => (
                <li key={ad.id}>
                  <Link
                    href={`/admin/ads/${ad.id}`}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {ad.title.eng || ad.title.jpn || t("common.untitled")}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {ad.advertiserName} • {ad.tags.slice(0, 3).join(", ")}
                        {ad.tags.length > 3 && ` +${ad.tags.length - 3}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(ad.status)}`}>
                        {t(`status.${ad.status}`)}
                      </span>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
