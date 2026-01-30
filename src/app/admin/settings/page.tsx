"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage, useTranslation } from "@/contexts/LanguageContext";
import PageHeader from "@/components/admin/PageHeader";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col min-h-screen">
      <PageHeader
        title={t("settings.title")}
        description={t("settings.description")}
      />

      <div className="flex-1 p-6">
        <div className="max-w-2xl space-y-6">
          {/* Language Settings Card */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t("settings.language")}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {t("settings.languageDescription")}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setLanguage("en")}
                className={`flex-1 rounded-lg border-2 p-4 text-center transition-all ${
                  language === "en"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold"
                    : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage("ja")}
                className={`flex-1 rounded-lg border-2 p-4 text-center transition-all ${
                  language === "ja"
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-semibold"
                    : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                }`}
              >
                日本語
              </button>
            </div>
          </div>

          {/* Theme Settings Card */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {t("settings.appearance")}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              {t("settings.appearanceDescription")}
            </p>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {t("settings.theme")}
              </span>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5 text-yellow-500" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-700" />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
