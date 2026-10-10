import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { TRANSLATIONS, type Lang, type TranslationKey } from '@/lib/i18n';
import { LANGUAGE_MAP, isRtl } from '@/lib/languages';

const STORAGE_KEY = 'worldface.appSettings';

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'en',
  setLang: () => {},
  t: (k) => k,
});

const readInitialLang = (): Lang => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.language === 'string' && LANGUAGE_MAP[parsed.language]) return parsed.language;
    }
  } catch {
    /* ignore */
  }
  return 'en';
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(readInitialLang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = isRtl(lang) ? 'rtl' : 'ltr';
  }, [lang]);

  // Cross-tab / Settings page sync
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setLangState(readInitialLang());
    };
    window.addEventListener('storage', onStorage);
    const onCustom = () => setLangState(readInitialLang());
    window.addEventListener('worldface:settings-changed', onCustom);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('worldface:settings-changed', onCustom);
    };
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const current = raw ? JSON.parse(raw) : {};
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, language: l }));
      window.dispatchEvent(new Event('worldface:settings-changed'));
    } catch {
      /* ignore */
    }
  };

  const t = (key: TranslationKey) => {
    const base = lang.split('-')[0];
    return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS[base]?.[key] ?? TRANSLATIONS.en[key] ?? key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
