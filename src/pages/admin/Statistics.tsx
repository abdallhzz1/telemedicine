import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Users,
    Calendar,
    FlaskConical,
    Activity,
    UserPlus,
    Stethoscope,
    Microscope,
    ShieldCheck
} from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/stat-card';
import { GlassCard } from '@/components/ui/glass-card';
import { PageLoading } from '@/components/ui/loading-spinner';
import { getStatistics } from '@/lib/firestore';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie
} from 'recharts';

export default function AdminStatistics() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<any>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await getStatistics();
                setStats(data);
            } catch (error) {
                console.error('Error fetching statistics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) {
        return (
            <DashboardLayout>
                <PageLoading />
            </DashboardLayout>
        );
    }

    const roleData = stats ? Object.entries(stats.usersByRole).map(([name, value]) => ({
        name: t(`roles.${name}`),
        value
    })) : [];

    const COLORS = ['#2FB8C6', '#3DE0E6', '#1E4F6F', '#9AA4B2'];

    return (
        <DashboardLayout>
            <PageHeader
                title={t('admin.stats.title')}
                description={t('admin.stats.subtitle')}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                    title={t('admin.totalUsers')}
                    value={stats?.totalUsers || 0}
                    icon={Users}
                />
                <StatCard
                    title={t('admin.totalAppointments')}
                    value={stats?.totalAppointments || 0}
                    icon={Calendar}
                />
                <StatCard
                    title={t('nav.labRequests')}
                    value={stats?.totalLabRequests || 0}
                    icon={FlaskConical}
                />
                <StatCard
                    title={t('admin.stats.activeSystems')}
                    value={4}
                    icon={Activity}
                />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                <GlassCard>
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <UserPlus className="h-5 w-5 text-primary" />
                        {t('admin.stats.distribution')}
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={roleData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="name" stroke="#9AA4B2" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#9AA4B2" fontSize={12} tickLine={false} axisLine={false} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(61, 224, 230, 0.1)' }}
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--foreground))' }}
                                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                                />
                                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                    {roleData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </GlassCard>

                <GlassCard>
                    <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                        <PieChart className="h-5 w-5 text-primary" />
                        {t('admin.stats.composition')}
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={roleData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {roleData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px', color: 'hsl(var(--foreground))' }}
                                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center flex-wrap gap-4 mt-4">
                        {roleData.map((role, index) => (
                            <div key={index} className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                                <span className="text-xs text-muted-foreground">{role.name}</span>
                            </div>
                        ))}
                    </div>
                </GlassCard>
            </div>

            <div className="grid lg:grid-cols-3 gap-6 mt-6">
                <GlassCard className="flex flex-col items-center p-6 text-center">
                    <Stethoscope className="h-10 w-10 text-primary mb-3" />
                    <h4 className="font-semibold">{t('admin.stats.countDoctors', { count: stats?.usersByRole?.doctor || 0 })}</h4>
                    <p className="text-sm text-muted-foreground">{t('admin.stats.doctorsDesc')}</p>
                </GlassCard>
                <GlassCard className="flex flex-col items-center p-6 text-center">
                    <Microscope className="h-10 w-10 text-accent mb-3" />
                    <h4 className="font-semibold">{t('admin.stats.countLabs', { count: stats?.usersByRole?.lab || 0 })}</h4>
                    <p className="text-sm text-muted-foreground">{t('admin.stats.labsDesc')}</p>
                </GlassCard>
                <GlassCard className="flex flex-col items-center p-6 text-center">
                    <ShieldCheck className="h-10 w-10 text-primary mb-3" />
                    <h4 className="font-semibold">{t('admin.stats.countAdmins', { count: stats?.usersByRole?.admin || 0 })}</h4>
                    <p className="text-sm text-muted-foreground">{t('admin.stats.adminsDesc')}</p>
                </GlassCard>
            </div>
        </DashboardLayout>
    );
}
