"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, Globe } from "lucide-react";

type Theme = "light" | "dark";
type Language = "en" | "ja";

export default function SettingsPage() {
  const [theme, setTheme] = useState<Theme>("light");
  const [language, setLanguage] = useState<Language>("en");
  const [mounted, setMounted] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const savedTheme = localStorage.getItem("theme") as Theme | null;
    const savedLanguage = localStorage.getItem("language") as Language | null;
    if (savedTheme) setTheme(savedTheme);
    if (savedLanguage) setLanguage(savedLanguage);
  }, []);

  // Save theme to localStorage and apply
  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    // Apply theme to document (for future ThemeContext integration)
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Save language to localStorage
  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
    localStorage.setItem("language", newLanguage);
    // For future LanguageContext integration
  };

  if (!mounted) {
    return null;
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage your application preferences</p>
      </div>

      <div className="space-y-6">
        {/* Theme Settings Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            {theme === "dark" ? (
              <Moon className="w-5 h-5 text-gray-700" />
            ) : (
              <Sun className="w-5 h-5 text-yellow-500" />
            )}
            <div>
              <h2 className="text-lg font-medium text-gray-900">Appearance</h2>
              <p className="text-sm text-gray-500">
                Choose between light and dark mode
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => handleThemeChange("light")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-colors ${
                theme === "light"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Sun className="w-4 h-4" />
              Light
            </button>
            <button
              onClick={() => handleThemeChange("dark")}
              className={`flex items-center gap-2 px-4 py-2 rounded-md border transition-colors ${
                theme === "dark"
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Moon className="w-4 h-4" />
              Dark
            </button>
          </div>
        </div>

        {/* Language Settings Card */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-5 h-5 text-gray-700" />
            <div>
              <h2 className="text-lg font-medium text-gray-900">Language</h2>
              <p className="text-sm text-gray-500">
                Select your preferred language
              </p>
            </div>
          </div>
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value as Language)}
            className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="en">English</option>
            <option value="ja">日本語 (Japanese)</option>
          </select>
        </div>

        {/* Info Card */}
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
          <p>
            Note: Theme and language settings are saved to your browser and will
            persist across sessions.
          </p>
        </div>
      </div>
    </div>
  );
}
