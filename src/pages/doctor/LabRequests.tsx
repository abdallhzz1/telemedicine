import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Plus, FlaskConical } from 'lucide-react';
import { useProfile } from '@/store/authStore';
import { useLangStore } from '@/store/langStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { PageLoading } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getLabRequests, LabRequest } from '@/lib/firestore';
import { motion } from 'framer-motion';

export default function DoctorLabRequests() {
  const { t } = useTranslation();
  const profile = useProfile();
  const { direction } = useLangStore();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<LabRequest[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchRequests = async () => {
      if (!profile?.uid) return;

      try {
        const data = await getLabRequests(profile.uid, 'doctor', filter === 'all' ? undefined : filter);
        setRequests(data);
      } catch (error) {
        console.error('Error fetching lab requests:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, [profile?.uid, filter]);

  if (loading) {
    return (
      <DashboardLayout>
        <PageLoading />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader title={t('nav.labRequests')}>
        <Link to="/doctor/lab-requests/create">
          <Button className="btn-gradient">
            <Plus className="h-4 w-4 me-2" />
            {t('doctor.createLabRequest')}
          </Button>
        </Link>
      </PageHeader>

      <Tabs dir={direction} value={filter} onValueChange={setFilter} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">{t('common.all')}</TabsTrigger>
          <TabsTrigger value="new">{t('status.new')}</TabsTrigger>
          <TabsTrigger value="in_progress">{t('status.inProgress')}</TabsTrigger>
          <TabsTrigger value="ready">{t('status.ready')}</TabsTrigger>
          <TabsTrigger value="rejected">{t('status.rejected')}</TabsTrigger>
        </TabsList>
      </Tabs>

      {requests.length > 0 ? (
        <div className="grid gap-4">
          {requests.map((request, index) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <GlassCard hover>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <FlaskConical className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{request.testType}</p>
                      <p className="text-sm text-muted-foreground">
                        {request.patientName
                          ? t('doctor.prescriptions.patient', { name: request.patientName })
                          : t('doctor.prescriptions.patient', { name: request.patientId.slice(0, 8) })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(request.createdAt, 'MMM dd, yyyy • HH:mm')}
                      </p>
                      {request.notes && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {t('doctor.notes')}: {request.notes}
                        </p>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={request.status} />
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      ) : (
        <GlassCard>
          <EmptyState
            icon={FlaskConical}
            title={t('common.noData')}
            description={t('doctor.noLabRequests')}
            action={
              <Link to="/doctor/lab-requests/create">
                <Button className="btn-gradient">
                  <Plus className="h-4 w-4 me-2" />
                  {t('doctor.createLabRequest')}
                </Button>
              </Link>
            }
          />
        </GlassCard>
      )}
    </DashboardLayout>
  );
}
