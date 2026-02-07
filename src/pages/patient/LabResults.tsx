import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Microscope, Download, ExternalLink, Calendar } from 'lucide-react';
import { useProfile } from '@/store/authStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/glass-card';
import { PageLoading } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { getLabRequests, getLabResults, LabRequest, LabResult } from '@/lib/firestore';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Button } from '@/components/ui/button';

export default function PatientLabResults() {
    const { t, i18n } = useTranslation();
    const profile = useProfile();
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<LabRequest[]>([]);
    const [results, setResults] = useState<Record<string, LabResult[]>>({});

    useEffect(() => {
        const fetchResults = async () => {
            if (!profile?.uid) return;
            try {
                // Fetch lab requests for this patient
                const reqs = await getLabRequests(profile.uid, 'patient');
                const readyReqs = reqs.filter(r => r.status === 'ready');
                setRequests(readyReqs);

                const readyIds = readyReqs.map(r => r.id);
                if (readyIds.length > 0) {
                    const resMap: Record<string, LabResult[]> = {};
                    // Fetch associated results (batched by 10 due to Firestore "in" limit)
                    for (let i = 0; i < readyIds.length; i += 10) {
                        const batch = readyIds.slice(i, i + 10);
                        const res = await getLabResults(batch);
                        res.forEach(r => {
                            if (!resMap[r.requestId]) resMap[r.requestId] = [];
                            resMap[r.requestId].push(r);
                        });
                    }

                    // Sort each requestId's results by uploadedAt descending
                    Object.keys(resMap).forEach(reqId => {
                        resMap[reqId].sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime());
                    });

                    setResults(resMap);
                }
            } catch (error) {
                console.error('Error fetching lab results:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [profile?.uid]);

    if (loading) {
        return (
            <DashboardLayout>
                <PageLoading />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <PageHeader
                title={t('nav.labResults')}
                description={t('labResults.patientSubtitle')}
            />

            {requests.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {requests.map((request) => {
                        const requestResults = results[request.id] || [];
                        return (
                            <GlassCard key={request.id} hover className="flex flex-col border-s-4 border-s-primary p-4 md:p-6">
                                <div className="flex justify-between items-start mb-3 md:mb-4">
                                    <div className="min-w-0 pe-2">
                                        <h3 className="text-base md:text-lg font-bold text-primary truncate">{request.testType}</h3>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">ID: {request.id.slice(-8)}</p>
                                    </div>
                                    <div className="p-2 md:p-3 rounded-xl bg-primary/10 text-primary shrink-0">
                                        <Microscope className="h-5 w-5 md:h-6 md:w-6" />
                                    </div>
                                </div>

                                <div className="space-y-3 mb-3 md:mb-4">
                                    <div className="flex items-center gap-2 text-[11px] md:text-xs">
                                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                        <span>{t('labResults.requested')}: {format(request.createdAt, 'PP', { locale: i18n.language === 'ar' ? ar : undefined })}</span>
                                    </div>
                                </div>

                                {requestResults.length > 0 ? (
                                    <div className="mt-auto space-y-4 md:space-y-6">
                                        {requestResults.map((result, index) => (
                                            <div key={result.id} className="pt-3 md:pt-4 border-t border-border/50 first:pt-0 first:border-t-0">
                                                <div className="flex justify-between items-center mb-2 md:mb-3">
                                                    <p className="text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                                        V{requestResults.length - index}
                                                        {index === 0 && (
                                                            <span className="ms-2 px-1.5 py-0.5 rounded bg-success/10 text-success text-[8px] md:text-[9px]">{t('labResults.latest')}</span>
                                                        )}
                                                    </p>
                                                    <span className="text-[9px] md:text-[10px] text-muted-foreground">
                                                        {format(result.uploadedAt, 'MMM dd, HH:mm', { locale: i18n.language === 'ar' ? ar : undefined })}
                                                    </span>
                                                </div>

                                                {result.resourceType === 'image' && (
                                                    <div className="mb-2 md:mb-3 rounded-xl overflow-hidden border border-border/50 bg-black/5">
                                                        <img
                                                            src={result.fileUrl}
                                                            alt={`${request.testType} v${requestResults.length - index}`}
                                                            className="w-full h-28 md:h-40 object-contain hover:scale-105 transition-transform duration-300"
                                                        />
                                                    </div>
                                                )}

                                                {result.editedReason && (
                                                    <div className="mb-2 md:mb-3 p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/10 text-[9px] md:text-[10px] italic text-yellow-700">
                                                        <strong>{t('labResults.note')}:</strong> {result.editedReason}
                                                    </div>
                                                )}

                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm" className="flex-1 h-8 text-[11px] md:text-xs gap-1.5 border-primary/50 text-primary" asChild>
                                                        <a href={result.fileUrl} target="_blank" rel="noopener noreferrer">
                                                            <ExternalLink className="h-3 w-3" />
                                                            {t('common.view')}
                                                        </a>
                                                    </Button>
                                                    <Button size="sm" className="btn-gradient flex-1 h-8 text-[11px] md:text-xs gap-1.5" asChild>
                                                        <a href={result.fileUrl} download>
                                                            <Download className="h-3 w-3" />
                                                            {t('common.download')}
                                                        </a>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="mt-auto p-3 rounded-lg bg-yellow-500/10 text-yellow-500 text-[10px] md:text-xs text-center border border-yellow-500/30">
                                        {t('labResults.processing')}
                                    </div>
                                )}
                            </GlassCard>
                        );
                    })}
                </div>
            ) : (
                <EmptyState
                    title={t('labResults.noReadyReports')}
                    description={t('labResults.readyReportsDesc')}
                />
            )}
        </DashboardLayout>
    );
}
