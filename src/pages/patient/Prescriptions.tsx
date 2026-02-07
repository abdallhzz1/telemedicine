import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Download } from 'lucide-react';
import { useProfile } from '@/store/authStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/glass-card';
import { PageLoading } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { getPrescriptions, Prescription } from '@/lib/firestore';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { generatePrescriptionPDF } from '@/lib/pdf';

export default function PatientPrescriptions() {
    const { t, i18n } = useTranslation();
    const profile = useProfile();
    const [loading, setLoading] = useState(true);
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

    useEffect(() => {
        const fetchPrescriptions = async () => {
            if (!profile?.uid) return;
            try {
                const data = await getPrescriptions(profile.uid, 'patient');
                setPrescriptions(data);
            } catch (error) {
                console.error('Error fetching prescriptions:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPrescriptions();
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
                title={t('doctor.prescriptions.title')}
                description={t('appointments.listSubtitle')}
            />

            {prescriptions.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {prescriptions.map((prescription) => (
                        <GlassCard key={prescription.id} hover className="flex flex-col h-full p-4 md:p-6 border-t-4 border-t-accent">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-2.5 rounded-xl bg-accent/10 text-accent">
                                    <FileText className="h-5 w-5 md:h-6 md:w-6" />
                                </div>
                                <div className="text-end">
                                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{t('appointments.prescribedOn')}</p>
                                    <p className="font-bold text-xs md:text-sm">{format(prescription.createdAt, 'MMM dd, yyyy', { locale: i18n.language === 'ar' ? ar : undefined })}</p>
                                </div>
                            </div>

                            <div className="flex-1 space-y-3">
                                {prescription.medicines.map((med, idx) => (
                                    <div key={idx} className="p-3 rounded-2xl bg-secondary/10 border border-border/30 group hover:bg-secondary/20 transition-colors">
                                        <p className="font-bold text-primary text-[13px] md:text-sm">{med.name}</p>
                                        <div className="flex justify-between text-[11px] md:text-xs mt-1.5 font-medium opacity-80">
                                            <span className="text-muted-foreground">{med.dose}</span>
                                            <span className="text-accent">{med.duration}</span>
                                        </div>
                                        {med.notes && (
                                            <div className="mt-2 pt-2 border-t border-border/20">
                                                <p className="text-[10px] md:text-[11px] text-muted-foreground italic leading-relaxed">"{med.notes}"</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 pt-4 border-t border-border/30 flex justify-between items-center bg-transparent">
                                <div className="min-w-0 pe-2">
                                    <p className="text-[10px] text-muted-foreground">{t('appointments.doctor')}</p>
                                    <p className="text-xs md:text-sm font-bold truncate">Dr. {prescription.doctorName || t('appointments.medicalCenter')}</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => generatePrescriptionPDF(prescription)}
                                    className="h-9 px-3 text-primary hover:bg-primary/10 rounded-xl text-xs gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    <span className="hidden xs:inline">{t('common.view')} PDF</span>
                                </Button>
                            </div>
                        </GlassCard>
                    ))}
                </div>
            ) : (
                <EmptyState
                    title={t('appointments.noPrescriptions')}
                    description={t('appointments.noPrescriptionsDesc')}
                />
            )}
        </DashboardLayout>
    );
}
