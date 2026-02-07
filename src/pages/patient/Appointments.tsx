import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock } from 'lucide-react';
import { useProfile } from '@/store/authStore';
import { useLangStore } from '@/store/langStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/glass-card';
import { PageLoading } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { getAppointments, Appointment } from '@/lib/firestore';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import { updateAppointmentStatus } from '@/lib/firestore';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { XCircle, Video } from 'lucide-react';

export default function PatientAppointments() {
    const { t, i18n } = useTranslation();
    const profile = useProfile();
    const { direction } = useLangStore();
    const [loading, setLoading] = useState(true);
    const [appointments, setAppointments] = useState<Appointment[]>([]);

    const fetchAppointments = async () => {
        if (!profile?.uid) return;
        setLoading(true);
        try {
            const data = await getAppointments(profile.uid, 'patient');
            setAppointments(data);
        } catch (error) {
            console.error('Error fetching appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, [profile?.uid]);

    const handleCancel = async (id: string) => {
        try {
            await updateAppointmentStatus(id, 'cancelled');
            toast.success(t('appointments.cancelSuccess'));
            fetchAppointments();
        } catch (e) {
            toast.error(t('appointments.cancelError'));
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <PageLoading />
            </DashboardLayout>
        );
    }

    const upcoming = appointments.filter(a => a.status === 'upcoming');
    const past = appointments.filter(a => a.status !== 'upcoming');

    return (
        <DashboardLayout>
            <PageHeader
                title={t('nav.appointments')}
                description={t('appointments.subtitle')}
            >
                <Button asChild className="btn-gradient gap-2">
                    <Link to="/patient/book-appointment">
                        <Calendar className="h-4 w-4" />
                        {t('appointments.bookNew')}
                    </Link>
                </Button>
            </PageHeader>

            <Tabs dir={direction} defaultValue="upcoming" className="w-full">
                <TabsList className="bg-secondary/20 mb-6">
                    <TabsTrigger value="upcoming" className="gap-2">
                        {t('appointments.upcoming')} ({upcoming.length})
                    </TabsTrigger>
                    <TabsTrigger value="past" className="gap-2">
                        {t('appointments.past')} ({past.length})
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="upcoming">
                    <GlassCard className="p-0 sm:p-6 bg-transparent border-none sm:bg-card sm:border">
                        {upcoming.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                {upcoming.map((appt) => (
                                    <div key={appt.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl bg-secondary/10 border border-border/50 hover:border-primary/50 transition-all hover:shadow-glow-sm">
                                        <div className="flex items-center gap-4 mb-3 sm:mb-0 w-full sm:w-auto">
                                            <div className="p-2.5 rounded-xl bg-primary/20 shrink-0">
                                                <Calendar className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                                            </div>
                                            <div className="min-w-0 pe-2">
                                                <p className="font-bold text-sm md:text-base truncate">{appt.doctorName || t('roles.doctor')}</p>
                                                <p className="text-[11px] md:text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                                                    <Clock className="h-3 w-3" />
                                                    {format(appt.dateTime, 'MMM dd • HH:mm', { locale: i18n.language === 'ar' ? ar : undefined })}
                                                </p>
                                            </div>
                                            <div className="ms-auto sm:hidden">
                                                <StatusBadge status={appt.status} className="text-[10px]" />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 w-full sm:w-auto">
                                            <Button
                                                size="sm"
                                                className="flex-1 sm:flex-none h-9 gap-2 btn-gradient shadow-none"
                                                asChild
                                            >
                                                <Link to={`/video-room/${appt.id}`}>
                                                    <Video className="h-4 w-4" />
                                                    <span className="sm:hidden lg:inline">{t('appointments.joinCall')}</span>
                                                </Link>
                                            </Button>
                                            <div className="hidden sm:block">
                                                <StatusBadge status={appt.status} className="text-xs" />
                                            </div>
                                            {appt.status === 'upcoming' && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                                                            <XCircle className="h-5 w-5" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent className="glass-card">
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>{t('appointments.cancelDialogTitle')}</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                {t('appointments.cancelDialogDesc', { name: appt.doctorName })}
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter className="gap-2">
                                                            <AlertDialogCancel className="rounded-xl">{t('appointments.keepAppointment')}</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleCancel(appt.id)} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-all">
                                                                {t('appointments.confirmCancel')}
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                title={t('appointments.noAppointments')}
                                description={t('appointments.noAppointmentsScheduled')}
                            />
                        )}
                    </GlassCard>
                </TabsContent>

                <TabsContent value="past">
                    <GlassCard className="p-0 sm:p-6 bg-transparent border-none sm:bg-card sm:border">
                        {past.length > 0 ? (
                            <>
                                {/* Desktop Table View */}
                                <div className="hidden md:block overflow-x-auto">
                                    <table className="w-full text-start">
                                        <thead>
                                            <tr className="border-b border-border/50">
                                                <th className="pb-4 pt-1 font-semibold text-muted-foreground">{t('appointments.doctor')}</th>
                                                <th className="pb-4 pt-1 font-semibold text-muted-foreground">{t('appointments.date')}</th>
                                                <th className="pb-4 pt-1 font-semibold text-muted-foreground">{t('appointments.status')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/30">
                                            {past.map((appt) => (
                                                <tr key={appt.id} className="hover:bg-secondary/10 transition-colors">
                                                    <td className="py-4 font-medium">{appt.doctorName || 'Doctor'}</td>
                                                    <td className="py-4 text-sm text-muted-foreground">{format(appt.dateTime, 'PPP p')}</td>
                                                    <td className="py-4"><StatusBadge status={appt.status} /></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Mobile Card View */}
                                <div className="md:hidden divide-y divide-border/30">
                                    {past.map((appt) => (
                                        <div key={appt.id} className="p-4 space-y-2">
                                            <div className="flex justify-between items-start">
                                                <div className="min-w-0 pe-2">
                                                    <p className="font-bold text-sm truncate">{appt.doctorName || 'Doctor'}</p>
                                                    <p className="text-[11px] text-muted-foreground mt-0.5">
                                                        {format(appt.dateTime, 'MMM dd, yyyy')}
                                                    </p>
                                                </div>
                                                <StatusBadge status={appt.status} className="text-[10px]" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <EmptyState title={t('appointments.noPastAppointments')} description={t('appointments.pastAppointmentsDesc')} />
                        )}
                    </GlassCard>
                </TabsContent>
            </Tabs>
        </DashboardLayout>
    );
}
