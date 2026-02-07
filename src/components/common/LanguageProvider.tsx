import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLangStore } from '@/store/langStore';

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const { i18n } = useTranslation();
    const { language, direction } = useLangStore();

    useEffect(() => {
        // This ensures i18n is always in sync with our store
        if (i18n.language !== language) {
            i18n.changeLanguage(language);
        }

        // Ensure DOM attributes are always correct
        document.documentElement.dir = direction;
        document.documentElement.lang = language;
    }, [language, direction, i18n]);

    return <>{children}</>;
}
