import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
    User,
    Mail,
    Shield,
    Calendar,
    ArrowLeft,
    UserCheck,
    UserX,
    Clock
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { PageLoading } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { getUserById, updateUserStatus, getAppointments } from '@/lib/firestore';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AdminUserDetails() {
    const { uid } = useParams<{ uid: string }>();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<any>(null);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);

    useEffect(() => {
        const fetchUser = async () => {
            if (!uid) return;
            try {
                const userData = await getUserById(uid);
                setUser(userData);

                // Fetch some activity based on role
                if (userData?.role === 'patient' || userData?.role === 'doctor') {
                    const appts = await getAppointments(uid, userData.role as any, undefined, 5);
                    setRecentActivity(appts);
                }
            } catch (error) {
                console.error('Error fetching user:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [uid]);

    const toggleStatus = async () => {
        if (!uid || !user) return;
        const newStatus = user.status === 'active' ? 'disabled' : 'active';
        try {
            await updateUserStatus(uid, newStatus);
            setUser({ ...user, status: newStatus });
            toast.success(`User status updated to ${newStatus}`);
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

    if (!user) {
        return (
            <DashboardLayout>
                <EmptyState title={t('admin.userNotFound')} description={t('admin.userNotFoundDesc')} />
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="mb-4">
                <Link to="/admin/users" className="text-primary hover:underline flex items-center gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    {t('common.back')}
                </Link>
            </div>

            <PageHeader
                title={user.fullName}
                description={`${t('common.role')}: ${t(`roles.${user.role}`)}`}
            >
                <Button
                    variant={user.status === 'active' ? 'destructive' : 'outline'}
                    className={user.status !== 'active' ? 'text-green-500 border-green-500 hover:bg-green-500/10' : ''}
                    onClick={toggleStatus}
                >
                    {user.status === 'active' ? (
                        <>
                            <UserX className="h-4 w-4 me-2" />
                            {t('admin.disableAccount')}
                        </>
                    ) : (
                        <>
                            <UserCheck className="h-4 w-4 me-2" />
                            {t('admin.enableAccount')}
                        </>
                    )}
                </Button>
            </PageHeader>

            <div className="grid lg:grid-cols-3 gap-6">
                <GlassCard className="lg:col-span-1 h-fit">
                    <div className="flex flex-col items-center text-center p-4">
                        <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                            <User className="h-12 w-12 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold">{user.fullName}</h2>
                        <div className={`mt-2 px-3 py-1 rounded-full text-xs font-medium ${user.status === 'active' ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'
                            }`}>
                            {t(`status.${user.status}`)}
                        </div>
                    </div>

                    <div className="mt-6 space-y-4 px-4 pb-4">
                        <div className="flex items-center gap-3">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{user.email}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm capitalize">{t(`roles.${user.role}`)}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{t('admin.joined')} {format(user.createdAt, 'PP')}</span>
                        </div>
                    </div>
                </GlassCard>

                <div className="lg:col-span-2 space-y-6">
                    <GlassCard>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-primary" />
                            {t('admin.recentActivity')}
                        </h3>
                        {recentActivity.length > 0 ? (
                            <div className="space-y-4">
                                {recentActivity.map((activity, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-4 rounded-lg bg-secondary/10 border border-border/30">
                                        <div>
                                            <p className="font-medium">{t('admin.appointment')}</p>
                                            <p className="text-sm text-muted-foreground">{format(activity.dateTime, 'PPp')}</p>
                                        </div>
                                        <div className="text-xs uppercase px-2 py-1 rounded bg-primary/10 text-primary">
                                            {t(`status.${activity.status}`)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                title={t('admin.noRecentActivity')}
                                description={t('admin.noRecentActivityDesc')}
                            />
                        )}
                    </GlassCard>
                </div>
            </div>
        </DashboardLayout>
    );
}
