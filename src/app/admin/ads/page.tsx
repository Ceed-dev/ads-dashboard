"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Plus, Search, ChevronRight } from "lucide-react";
import type { AdDTO } from "@/types/ad";
import { useTranslation } from "@/contexts/LanguageContext";

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

  const { data: ads = [], isLoading } = useQuery<AdDTO[]>({
    queryKey: ["ads", { search, status: statusFilter }],
    queryFn: () => fetchAds({ search, status: statusFilter }),
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "paused": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "archived": return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t("ads.title")}</h1>
        <Link
          href="/admin/ads/new"
          className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("ads.newAd")}
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        <div className="p-4 border-b dark:border-gray-700 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t("ads.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 dark:bg-gray-700 dark:text-white"
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
          <ul className="divide-y dark:divide-gray-700">
            {ads.map((ad) => (
              <li key={ad.id}>
                <Link
                  href={`/admin/ads/${ad.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
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
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(ad.status)}`}>
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
  );
}
