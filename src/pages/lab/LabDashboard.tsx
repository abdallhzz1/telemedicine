import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ClipboardList, Clock, CheckCircle, XCircle, Plus } from 'lucide-react';
import { useProfile } from '@/store/authStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/stat-card';
import { GlassCard } from '@/components/ui/glass-card';
import { StatusBadge } from '@/components/ui/status-badge';
import { PageLoading } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { getLabRequests, LabRequest } from '@/lib/firestore';
import { useDateFormatter } from '@/hooks/useDateFormatter';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

import { toast } from 'sonner';

export default function LabDashboard() {
  const { t } = useTranslation();
  const profile = useProfile();
  const { format } = useDateFormatter();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<LabRequest[]>([]);
  const [stats, setStats] = useState({
    new: 0,
    in_progress: 0,
    ready: 0,
    rejected: 0,
  });


  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.uid) return;

      try {
        const data = await getLabRequests(profile.uid, 'lab');
        setRequests(data);

        const newStats = {
          new: data.filter(r => r.status === 'new').length,
          in_progress: data.filter(r => r.status === 'in_progress').length,
          ready: data.filter(r => r.status === 'ready').length,
          rejected: data.filter(r => r.status === 'rejected').length,
        };
        setStats(newStats);
      } catch (error) {
        console.error('Error fetching lab data:', error);
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
        title={`${t('common.welcome')}, ${profile?.labName || profile?.fullName}`}
        description={t('nav.dashboard')}
      >

      </PageHeader>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title={t('lab.newRequests')}
          value={stats.new}
          icon={ClipboardList}
        />
        <StatCard
          title={t('lab.inProgressRequests')}
          value={stats.in_progress}
          icon={Clock}
        />
        <StatCard
          title={t('lab.readyResults')}
          value={stats.ready}
          icon={CheckCircle}
        />
        <StatCard
          title={t('lab.rejectedRequests')}
          value={stats.rejected}
          icon={XCircle}
        />
      </div>

      {/* Recent Requests */}
      <GlassCard>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t('lab.newRequests')}</h2>
          <Link to="/lab/requests">
            <Button variant="ghost" size="sm" className="text-primary">
              {t('common.view')} →
            </Button>
          </Link>
        </div>

        {requests.filter(r => r.status === 'new').length > 0 ? (
          <div className="space-y-3">
            {requests.filter(r => r.status === 'new').slice(0, 5).map((request, index) => (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 md:p-4 rounded-xl bg-secondary/10 hover:bg-secondary/20 transition-all border border-transparent hover:border-primary/20"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm md:text-base truncate">{request.testType}</p>
                  <p className="text-[11px] md:text-sm text-muted-foreground">
                    {format(request.createdAt, 'MMM dd • HH:mm')}
                  </p>
                </div>
                <div className="ms-2">
                  <StatusBadge status={request.status} className="text-[10px] md:text-xs" />
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <EmptyState
            title={t('common.noData')}
            description={t('lab.noNewRequests')}
          />
        )}
      </GlassCard>
    </DashboardLayout>
  );
}
