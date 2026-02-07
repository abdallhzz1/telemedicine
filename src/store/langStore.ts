import { create } from 'zustand';
import { persist } from 'zustand/middleware';


type Language = 'en' | 'ar';
type Direction = 'ltr' | 'rtl';

interface LangState {
  language: Language;
  direction: Direction;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
}

export const useLangStore = create<LangState>()(
  persist(
    (set, get) => ({
      language: 'en',
      direction: 'ltr',

      setLanguage: (language) => {
        // Set state but let LanguageProvider handle the i18n and DOM side effects if desired, 
        // or keep DOM updates here for immediate feedback, but remove i18next call
        const direction = language === 'ar' ? 'rtl' : 'ltr';
        // We can keep these for immediate feedback, but LanguageProvider ensures sync
        document.documentElement.setAttribute('dir', direction);
        document.documentElement.setAttribute('lang', language);

        set({ language, direction });
      },

      toggleLanguage: () => {
        const newLang = get().language === 'en' ? 'ar' : 'en';
        get().setLanguage(newLang);
      },
    }),
    {
      name: 'lang-storage',
      onRehydrateStorage: () => (state) => {
        // Hydration logic - let the Provider handle the heavy lifting
        if (state) {
          document.documentElement.setAttribute('dir', state.direction);
          document.documentElement.setAttribute('lang', state.language);
        }
      },
    }
  )
);

export const useLanguage = () => useLangStore((state) => state.language);
export const useDirection = () => useLangStore((state) => state.direction);
