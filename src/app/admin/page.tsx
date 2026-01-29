"use client";

import Link from "next/link";
import { Users, Megaphone, ArrowRight } from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";

export default function AdminDashboard() {
  const { t } = useTranslation();

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        {t("dashboard.title")}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link
          href="/admin/advertisers"
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
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
          className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
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

      <div className="mt-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t("dashboard.quickActions")}
        </h2>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/admin/advertisers/new"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Users className="w-4 h-4 mr-2" />
            {t("advertisers.newAdvertiser")}
          </Link>
          <Link
            href="/admin/ads/new"
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <Megaphone className="w-4 h-4 mr-2" />
            {t("ads.newAd")}
          </Link>
        </div>
      </div>
    </div>
  );
}
