"use client";

import Link from "next/link";
import { Users, Megaphone, ArrowRight, Plus } from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";
import PageHeader from "@/components/admin/PageHeader";

export default function AdminDashboard() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title={t("dashboard.title")}
        description={t("dashboard.description")}
      />

      <div className="flex-1 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link
            href="/admin/advertisers"
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t("nav.advertisers")}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("dashboard.manageAdvertisers")}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
          </Link>

          <Link
            href="/admin/ads"
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                  <Megaphone className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="ml-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {t("nav.ads")}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t("dashboard.manageAds")}
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
          </Link>
        </div>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t("dashboard.quickActions")}
          </h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/admin/advertisers/new"
              className="inline-flex items-center px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("advertisers.newAdvertiser")}
            </Link>
            <Link
              href="/admin/ads/new"
              className="inline-flex items-center px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t("ads.newAd")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
