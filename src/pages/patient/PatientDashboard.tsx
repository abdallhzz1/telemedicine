import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Calendar, FileText, FlaskConical, Clock } from 'lucide-react';
import { useProfile } from '@/store/authStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/stat-card';
import { GlassCard } from '@/components/ui/glass-card';
import { PageLoading } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { getUpcomingAppointments, getPrescriptions, Appointment, Prescription } from '@/lib/firestore';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion } from 'framer-motion';

import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

export default function PatientDashboard() {
    const { t, i18n } = useTranslation();
    const profile = useProfile();
    const [loading, setLoading] = useState(true);

    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!profile?.uid) return;

            try {
                const [upcomingAppts, userPrescriptions] = await Promise.all([
                    getUpcomingAppointments(profile.uid, 'patient', 5),
                    getPrescriptions(profile.uid, 'patient', 5),
                ]);

                setAppointments(upcomingAppts);
                setPrescriptions(userPrescriptions);
            } catch (error) {
                console.error('Error fetching patient dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
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
                title={`${t('common.welcome')}, ${profile?.fullName}`}
                description={t('nav.dashboard')}
            >
                <div className="flex flex-wrap gap-2 md:ms-auto">

                    <Button asChild className="btn-gradient gap-2 text-[11px] md:text-sm h-8 md:h-10">
                        <Link to="/patient/book-appointment">
                            <Calendar className="h-4 w-4" />
                            <span>{t('appointments.bookAppt')}</span>
                        </Link>
                    </Button>
                </div>
            </PageHeader>

            {/* Stats Grid - Optimized */}
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
                <StatCard
                    title={t('nav.appointments')}
                    value={appointments.length}
                    icon={Calendar}
                />
                <StatCard
                    title={t('doctor.prescriptions.title')}
                    value={prescriptions.length}
                    icon={FileText}
                />
                <StatCard
                    title={t('nav.labResults')}
                    value={0}
                    icon={FlaskConical}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                {/* Upcoming Appointments */}
                <GlassCard hover>
                    <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4">{t('doctor.upcomingAppointments')}</h2>
                    {appointments.length > 0 ? (
                        <div className="space-y-3">
                            {appointments.map((appointment, index) => (
                                <motion.div
                                    key={appointment.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <div className="flex items-center justify-between p-2.5 md:p-3 rounded-xl bg-secondary/10 hover:bg-secondary/20 transition-all border border-transparent hover:border-primary/20">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold text-sm md:text-base truncate">{appointment.doctorName || t('roles.doctor')}</p>
                                            <p className="text-[11px] md:text-sm text-muted-foreground flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {format(appointment.dateTime, 'MMM dd • HH:mm', { locale: i18n.language === 'ar' ? ar : undefined })}
                                            </p>
                                        </div>
                                        <div className="ms-2">
                                            <StatusBadge status={appointment.status} className="text-[10px] md:text-xs" />
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            title={t('appointments.noAppointments')}
                            description={t('appointments.noAppointmentsScheduled')}
                        />
                    )}
                </GlassCard>

                {/* Recent Prescriptions */}
                <GlassCard hover>
                    <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4">{t('doctor.prescriptions.title')}</h2>
                    {prescriptions.length > 0 ? (
                        <div className="space-y-3">
                            {prescriptions.map((prescription, index) => (
                                <motion.div
                                    key={prescription.id}
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="p-2.5 md:p-3 rounded-xl bg-secondary/10 hover:bg-secondary/20 transition-all border border-transparent hover:border-primary/20 flex items-center justify-between"
                                >
                                    <div className="flex-1 min-w-0 pe-2">
                                        <p className="font-semibold text-sm md:text-base">
                                            {prescription.medicines.map(m => m.name).join(', ')}
                                        </p>
                                        <p className="text-[11px] md:text-sm text-muted-foreground">
                                            {format(prescription.createdAt, 'MMM dd, yyyy', { locale: i18n.language === 'ar' ? ar : undefined })}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            title={t('common.noData')}
                            description={t('common.noDataAvailable')}
                        />
                    )}
                </GlassCard>
            </div >
        </DashboardLayout >
    );
}
