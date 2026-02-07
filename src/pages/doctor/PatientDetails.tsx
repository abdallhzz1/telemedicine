import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    Calendar,
    FileText,
    FlaskConical,
    User,
    ArrowLeft,
    MessageSquare,
    Plus
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { PageLoading } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getUserById, getAppointments, getPrescriptions, getOrCreateChat, Appointment, Prescription } from '@/lib/firestore';
import { useAuthStore } from '@/store/authStore';
import { useLangStore } from '@/store/langStore';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { DocumentData } from 'firebase/firestore';

export default function PatientDetails() {
    const { patientId } = useParams<{ patientId: string }>();
    const { t, i18n } = useTranslation();
    const navigate = useNavigate();
    const { toast } = useToast();
    const profile = useAuthStore(s => s.profile);
    const { direction } = useLangStore();
    const [loading, setLoading] = useState(true);
    const [patient, setPatient] = useState<DocumentData | null>(null);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!patientId) return;

            try {
                const [userData, userAppts, userPrescriptions] = await Promise.all([
                    getUserById(patientId),
                    getAppointments(patientId, 'patient'),
                    getPrescriptions(patientId, 'patient'),
                ]);

                setPatient(userData);
                setAppointments(userAppts);
                setPrescriptions(userPrescriptions);
            } catch (error) {
                console.error('Error fetching patient details:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [patientId]);

    const handleOpenChat = async () => {
        if (!patientId || !profile?.uid) return;
        try {
            const chatId = await getOrCreateChat(profile.uid, patientId);
            navigate(`/doctor/chat?chatId=${chatId}`);
        } catch (e) {
            toast({ title: t('patientDetails.chatError'), variant: "destructive" });
        }
    };


    if (loading) {
        return (
            <DashboardLayout>
                <PageLoading />
            </DashboardLayout>
        );
    }

    if (!patient) {
        return (
            <DashboardLayout>
                <EmptyState
                    title={t('patientDetails.notFound')}
                    description={t('patientDetails.notFoundDesc')}
                />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="mb-4">
                <Link to="/doctor/patients" className="text-primary hover:underline flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    {t('common.back')}
                </Link>
            </div>

            <PageHeader
                title={patient.fullName}
                description={`${t('profile.patientId')}: ${patient.uid}`}
            >
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2" onClick={handleOpenChat}>
                        <MessageSquare className="h-4 w-4" />
                        {t('nav.chat')}
                    </Button>
                    <Link to={`/doctor/appointments/create?patientId=${patientId}`}>
                        <Button size="sm" className="btn-gradient gap-2">
                            <Plus className="h-4 w-4" />
                            {t('nav.appointments')}
                        </Button>
                    </Link>
                </div>
            </PageHeader>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Patient Info Card */}
                <GlassCard className="lg:col-span-1">
                    <div className="flex flex-col items-center text-center p-4">
                        <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                            <User className="h-12 w-12 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold">{patient.fullName}</h2>
                        <p className="text-muted-foreground">{patient.email}</p>
                        <div className="mt-4 w-full space-y-2 text-sm">
                            <div className="flex justify-between py-2 border-b border-border/50">
                                <span className="text-muted-foreground">{t('appointments.status')}</span>
                                <span className="capitalize">{patient.status}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-border/50">
                                <span className="text-muted-foreground">{t('admin.joined')}</span>
                                <span>{format(patient.createdAt, 'MMM dd, yyyy', { locale: i18n.language === 'ar' ? ar : undefined })}</span>
                            </div>
                        </div>
                    </div>
                </GlassCard>

                {/* Tabs Section */}
                <div className="lg:col-span-2">
                    <Tabs dir={direction} defaultValue="appointments" className="w-full">
                        <TabsList className="bg-secondary/20 w-full justify-start overflow-x-auto">
                            <TabsTrigger value="appointments" className="gap-2">
                                <Calendar className="h-4 w-4" />
                                {t('nav.appointments')}
                            </TabsTrigger>
                            <TabsTrigger value="prescriptions" className="gap-2">
                                <FileText className="h-4 w-4" />
                                {t('doctor.prescriptions.title')}
                            </TabsTrigger>
                            <TabsTrigger value="results" className="gap-2">
                                <FlaskConical className="h-4 w-4" />
                                {t('nav.labResults')}
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="appointments" className="mt-6">
                            <GlassCard>
                                {appointments.length > 0 ? (
                                    <div className="space-y-4">
                                        {appointments.map((appt) => (
                                            <div key={appt.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/10 border border-border/50">
                                                <div>
                                                    <p className="font-medium">{format(appt.dateTime, 'MMMM dd, yyyy', { locale: i18n.language === 'ar' ? ar : undefined })}</p>
                                                    <p className="text-sm text-muted-foreground">{format(appt.dateTime, 'HH:mm')}</p>
                                                </div>
                                                <StatusBadge status={appt.status} />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState title={t('appointments.noAppointments')} description={t('admin.noAppointmentsDesc')} />
                                )}
                            </GlassCard>
                        </TabsContent>

                        <TabsContent value="prescriptions" className="mt-6">
                            <GlassCard>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-semibold">{t('doctor.prescriptions.title')}</h3>
                                    <Link to="/doctor/prescriptions/create">
                                        <Button size="sm" variant="ghost" className="text-primary gap-1">
                                            <Plus className="h-4 w-4" />
                                            {t('admin.add')}
                                        </Button>
                                    </Link>
                                </div>
                                {prescriptions.length > 0 ? (
                                    <div className="space-y-4">
                                        {prescriptions.map((p) => (
                                            <div key={p.id} className="p-4 rounded-lg bg-secondary/10 border border-border/50">
                                                <div className="flex justify-between mb-2">
                                                    <span className="text-sm text-muted-foreground">{format(p.createdAt, 'MMM dd, yyyy', { locale: i18n.language === 'ar' ? ar : undefined })}</span>
                                                </div>
                                                <ul className="list-disc list-inside">
                                                    {p.medicines.map((m, idx) => (
                                                        <li key={idx} className="text-sm">
                                                            <span className="font-medium">{m.name}</span> - {m.dose} ({m.duration})
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <EmptyState title={t('common.noData')} description={t('admin.noPrescriptionsDesc')} />
                                )}
                            </GlassCard>
                        </TabsContent>

                        <TabsContent value="results" className="mt-6">
                            <GlassCard>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-semibold">{t('nav.labResults')}</h3>
                                    <Link to="/doctor/lab-requests/create">
                                        <Button size="sm" variant="ghost" className="text-primary gap-1">
                                            <Plus className="h-4 w-4" />
                                            {t('doctor.createLabRequest')}
                                        </Button>
                                    </Link>
                                </div>
                                <EmptyState title={t('common.noData')} description={t('admin.noResultsDesc')} icon={FlaskConical} />
                            </GlassCard>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </DashboardLayout>
    );
}
