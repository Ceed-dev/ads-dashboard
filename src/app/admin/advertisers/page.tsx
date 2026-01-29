"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Plus, Search, ChevronRight } from "lucide-react";
import type { AdvertiserDTO } from "@/types/advertiser";
import { useTranslation } from "@/contexts/LanguageContext";

async function fetchAdvertisers(params: { search: string; status: string }) {
  const searchParams = new URLSearchParams();
  if (params.search) searchParams.set("q", params.search);
  if (params.status) searchParams.set("status", params.status);

  const res = await fetch(`/api/admin/advertisers?${searchParams}`);
  if (!res.ok) throw new Error("Failed to fetch advertisers");
  const data = await res.json();
  return data.items || [];
}

export default function AdvertisersPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data: advertisers = [], isLoading } = useQuery<AdvertiserDTO[]>({
    queryKey: ["advertisers", { search, status: statusFilter }],
    queryFn: () => fetchAdvertisers({ search, status: statusFilter }),
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t("advertisers.title")}
        </h1>
        <Link
          href="/admin/advertisers/new"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("advertisers.newAdvertiser")}
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
        <div className="p-4 border-b dark:border-gray-700 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t("advertisers.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">{t("common.allStatus")}</option>
            <option value="active">{t("status.active")}</option>
            <option value="suspended">{t("status.suspended")}</option>
          </select>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            {t("common.loading")}
          </div>
        ) : advertisers.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            {t("advertisers.noResults")}
          </div>
        ) : (
          <ul className="divide-y dark:divide-gray-700">
            {advertisers.map((advertiser) => (
              <li key={advertiser.id}>
                <Link
                  href={`/admin/advertisers/${advertiser.id}`}
                  className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {advertiser.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {advertiser.websiteUrl || t("common.noWebsite")}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        advertiser.status === "active"
                          ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                          : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                      }`}
                    >
                      {t(`status.${advertiser.status}`)}
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
