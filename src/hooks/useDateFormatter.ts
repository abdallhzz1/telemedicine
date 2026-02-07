import { useCallback } from 'react';
import { format as dateFnsFormat } from 'date-fns';
import { enUS, arSA } from 'date-fns/locale';
import { useLangStore } from '@/store/langStore';

export function useDateFormatter() {
    const { language } = useLangStore();

    const format = useCallback((date: Date | number, formatStr: string) => {
        const locale = language === 'ar' ? arSA : enUS;
        return dateFnsFormat(date, formatStr, { locale });
    }, [language]);

    return { format };
}
