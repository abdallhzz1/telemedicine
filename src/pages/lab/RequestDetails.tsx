import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    ArrowLeft,
    FlaskConical,
    User,
    Calendar,
    FileUp,
    Clock,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { PageLoading } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { updateLabRequestStatus, LabRequest } from '@/lib/firestore';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function LabRequestDetails() {
    const { requestId } = useParams<{ requestId: string }>();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [request, setRequest] = useState<LabRequest | null>(null);

    useEffect(() => {
        const fetchRequest = async () => {
            if (!requestId) return;
            try {
                const docSnap = await getDoc(doc(db, 'labRequests', requestId));
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setRequest({
                        id: docSnap.id,
                        ...data,
                        createdAt: data.createdAt?.toDate() || new Date(),
                    } as LabRequest);
                }
            } catch (error) {
                console.error('Error fetching request:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRequest();
    }, [requestId]);

    const handleUpdateStatus = async (status: 'in_progress' | 'rejected') => {
        if (!requestId) return;
        try {
            await updateLabRequestStatus(requestId, status);
            setRequest(prev => prev ? { ...prev, status } : null);
            toast.success(`Request status updated to ${status}`);
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <PageLoading />
            </DashboardLayout>
        );
    }

    if (!request) {
        return (
            <DashboardLayout>
                <EmptyState title="Request Not Found" description="The lab request could not be found." />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="mb-4">
                <Link to="/lab/requests" className="text-primary hover:underline flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    {t('common.back')}
                </Link>
            </div>

            <PageHeader
                title={`${t('nav.labRequests')} #${request.id.slice(-6).toUpperCase()}`}
                description={request.testType}
            >
                <div className="flex gap-2">
                    {request.status === 'new' && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:bg-destructive/10 border-destructive/50"
                                onClick={() => handleUpdateStatus('rejected')}
                            >
                                <XCircle className="h-4 w-4 me-2" />
                                {t('common.reject')}
                            </Button>
                            <Button
                                size="sm"
                                className="btn-gradient"
                                onClick={() => handleUpdateStatus('in_progress')}
                            >
                                <CheckCircle2 className="h-4 w-4 me-2" />
                                {t('common.accept')}
                            </Button>
                        </>
                    )}
                    {request.status === 'in_progress' && (
                        <Link to={`/lab/results/upload?requestId=${request.id}`}>
                            <Button size="sm" className="btn-gradient">
                                <FileUp className="h-4 w-4 me-2" />
                                {t('lab.uploadResult')}
                            </Button>
                        </Link>
                    )}
                </div>
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <GlassCard className="p-4 md:p-6 border-s-4 border-s-primary">
                    <h3 className="text-base md:text-lg font-bold mb-4 flex items-center gap-2">
                        <FlaskConical className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                        Request Information
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between py-2.5 border-b border-border/30 items-center">
                            <span className="text-[11px] md:text-sm text-muted-foreground">{t('doctor.testType')}</span>
                            <span className="font-bold text-[13px] md:text-base">{request.testType}</span>
                        </div>
                        <div className="flex justify-between py-2.5 border-b border-border/30 items-center">
                            <span className="text-[11px] md:text-sm text-muted-foreground">{t('common.status')}</span>
                            <StatusBadge status={request.status} className="text-[10px]" />
                        </div>
                        <div className="flex justify-between py-2.5 border-b border-border/30 items-center">
                            <span className="text-[11px] md:text-sm text-muted-foreground">{t('common.date')}</span>
                            <span className="flex items-center gap-2 text-[11px] md:text-sm font-medium">
                                <Calendar className="h-3.5 w-3.5 text-primary" />
                                {format(request.createdAt, 'PPP')}
                            </span>
                        </div>
                        <div className="pt-3">
                            <span className="text-[11px] md:text-sm text-muted-foreground block mb-2 font-medium">{t('common.notes')}</span>
                            <div className="bg-secondary/10 p-4 rounded-2xl text-[12px] md:text-sm leading-relaxed border border-border/50 text-foreground/80">
                                {request.notes || 'No notes provided'}
                            </div>
                        </div>
                    </div>
                </GlassCard>

                <GlassCard className="p-4 md:p-6 border-s-4 border-s-accent">
                    <h3 className="text-base md:text-lg font-bold mb-4 flex items-center gap-2">
                        <User className="h-4 w-4 md:h-5 md:w-5 text-accent" />
                        Patient & Doctor
                    </h3>
                    <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-secondary/10 border border-border/30 group hover:border-primary transition-all">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                                <User className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{t('nav.patients')}</p>
                                <p className="font-bold text-sm md:text-base truncate">{request.patientName || 'Loading...'}</p>
                                <p className="text-[10px] md:text-xs text-muted-foreground opacity-70">ID: {request.patientId.slice(-8)}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-secondary/10 border border-border/30 group hover:border-accent transition-all">
                            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-accent/20 flex items-center justify-center shrink-0">
                                <User className="h-5 w-5 md:h-6 md:w-6 text-accent" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Requested By</p>
                                <p className="font-bold text-sm md:text-base truncate">{request.doctorName || 'Doctor'}</p>
                                <p className="text-[10px] md:text-xs text-muted-foreground opacity-70">ID: {request.doctorId.slice(-8)}</p>
                            </div>
                        </div>
                    </div>
                </GlassCard>
            </div>
        </DashboardLayout>
    );
}
