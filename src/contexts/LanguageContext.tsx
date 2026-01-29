"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

import en from "@/locales/en.json";
import ja from "@/locales/ja.json";

export type Language = "en" | "ja";

type TranslationValue = string | Record<string, unknown>;
type Translations = Record<string, TranslationValue>;

const translations: Record<Language, Translations> = {
  en: en as Translations,
  ja: ja as Translations,
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

const STORAGE_KEY = "ads-dashboard-language";

function getNestedValue(obj: Translations, path: string): string {
  const keys = path.split(".");
  let current: unknown = obj;

  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path; // Return key if not found
    }
  }

  return typeof current === "string" ? current : path;
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");
  const [isHydrated, setIsHydrated] = useState(false);

  // Load language from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (stored && (stored === "en" || stored === "ja")) {
      setLanguageState(stored);
    }
    setIsHydrated(true);
  }, []);

  // Save language to localStorage when changed
  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }, []);

  // Translation function
  const t = useCallback(
    (key: string): string => {
      return getNestedValue(translations[language], key);
    },
    [language]
  );

  // Prevent hydration mismatch by not rendering until hydrated
  if (!isHydrated) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

export function useTranslation() {
  const { t } = useLanguage();
  return { t };
}
