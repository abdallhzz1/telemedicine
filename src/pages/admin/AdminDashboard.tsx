import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, UserCheck, Stethoscope, FlaskConical, Calendar, ClipboardList } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/stat-card';
import { GlassCard } from '@/components/ui/glass-card';
import { PageLoading } from '@/components/ui/loading-spinner';
import { getStatistics } from '@/lib/firestore';
import { useProfile } from '@/store/authStore';
import { Button } from '@/components/ui/button';

import { toast } from 'sonner';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const profile = useProfile();
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    totalUsers: 0,
    usersByRole: {} as Record<string, number>,
    totalAppointments: 0,
    totalLabRequests: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getStatistics();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <DashboardLayout><PageLoading /></DashboardLayout>;

  return (
    <DashboardLayout>
      <PageHeader title={`${t('common.welcome')}, ${profile?.fullName}`} description={t('nav.dashboard')}>

      </PageHeader>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
        <StatCard title={t('admin.totalUsers')} value={stats.totalUsers} icon={Users} />
        <StatCard title={t('admin.totalDoctors')} value={stats.usersByRole.doctor || 0} icon={Stethoscope} />
        <StatCard title={t('admin.totalPatients')} value={stats.usersByRole.patient || 0} icon={UserCheck} />
        <StatCard title={t('admin.totalLabs')} value={stats.usersByRole.lab || 0} icon={FlaskConical} />
        <StatCard title={t('nav.appointments')} value={stats.totalAppointments} icon={Calendar} />
        <StatCard title={t('nav.labRequests')} value={stats.totalLabRequests} icon={ClipboardList} />
      </div>
    </DashboardLayout>
  );
}
