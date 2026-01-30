"use client";

import { useState, useDeferredValue } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Plus, Search, ChevronRight } from "lucide-react";
import type { AdvertiserDTO } from "@/types/advertiser";
import { useTranslation } from "@/contexts/LanguageContext";
import PageHeader from "@/components/admin/PageHeader";

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
  const deferredSearch = useDeferredValue(search);

  const { data: advertisers = [], isLoading } = useQuery<AdvertiserDTO[]>({
    queryKey: ["advertisers", { search: deferredSearch, status: statusFilter }],
    queryFn: () => fetchAdvertisers({ search: deferredSearch, status: statusFilter }),
  });

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title={t("advertisers.title")}
        description={t("advertisers.description")}
      >
        <Link
          href="/admin/advertisers/new"
          className="inline-flex items-center px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("advertisers.newAdvertiser")}
        </Link>
      </PageHeader>

      <div className="flex-1 p-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg">
          <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={t("advertisers.searchPlaceholder")}
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
            <ul className="divide-y divide-gray-200 dark:divide-gray-800">
              {advertisers.map((advertiser) => (
                <li key={advertiser.id}>
                  <Link
                    href={`/admin/advertisers/${advertiser.id}`}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
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
                        className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                          advertiser.status === "active"
                            ? "bg-green-500 text-white"
                            : "bg-red-500 text-white"
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
    </div>
  );
}
