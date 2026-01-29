"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, LayoutDashboard, Users, Megaphone, Settings, Sun, Moon, Globe } from "lucide-react";
import type { SessionUser } from "@/lib/auth/session";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";

interface HeaderProps {
  user: SessionUser;
}

export default function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const navItems = [
    { href: "/admin", label: t("nav.dashboard"), icon: LayoutDashboard },
    { href: "/admin/advertisers", label: t("nav.advertisers"), icon: Users },
    { href: "/admin/ads", label: t("nav.ads"), icon: Megaphone },
    { href: "/admin/settings", label: t("nav.settings"), icon: Settings },
  ];

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ja" : "en");
  };

  return (
    <header className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {t("app.name")}
              </span>
            </div>
            <nav className="ml-10 flex space-x-4">
              {navItems.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== "/admin" && pathname.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white"
                        : "text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleLanguage}
              className="inline-flex items-center px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              aria-label="Toggle language"
            >
              <Globe className="w-4 h-4 mr-1" />
              {language.toUpperCase()}
            </button>
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-300">
              {user.email} ({user.role})
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {t("nav.logout")}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
