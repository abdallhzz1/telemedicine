import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import {
  Calendar,
  Users,
  FileText,
  FlaskConical,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useProfile } from '@/store/authStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatCard } from '@/components/ui/stat-card';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { PageLoading } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { getUpcomingAppointments, getPatientsForDoctor, Appointment } from '@/lib/firestore';
import { useDateFormatter } from '@/hooks/useDateFormatter';

import { toast } from 'sonner';

export default function DoctorDashboard() {
  const { t, i18n } = useTranslation();
  const profile = useProfile();
  const { format: formatLocalized } = useDateFormatter();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patientsCount, setPatientsCount] = useState(0);
  const [todayCount, setTodayCount] = useState(0);


  useEffect(() => {
    const fetchData = async () => {
      if (!profile?.uid) return;

      try {
        const [upcomingAppts, patients] = await Promise.all([
          getUpcomingAppointments(profile.uid, 'doctor', 5),
          getPatientsForDoctor(profile.uid),
        ]);

        setAppointments(upcomingAppts);
        setPatientsCount(patients.length);

        // Count today's appointments
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayAppts = upcomingAppts.filter(a => {
          const apptDate = new Date(a.dateTime);
          return apptDate >= today && apptDate < tomorrow;
        });
        setTodayCount(todayAppts.length);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
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

      </PageHeader>

      {/* Stats Grid - Optimized for all screens */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <StatCard
          title={t('doctor.todayAppointments')}
          value={todayCount}
          icon={Calendar}
        />
        <StatCard
          title={t('doctor.upcomingAppointments')}
          value={appointments.length}
          icon={Clock}
        />
        <StatCard
          title={t('doctor.totalPatients')}
          value={patientsCount}
          icon={Users}
        />
        <StatCard
          title={t('doctor.pendingLabResults')}
          value={0}
          icon={FlaskConical}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Quick Actions */}
        <GlassCard hover>
          <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4">{t('doctor.quickActions')}</h2>
          <div className="grid grid-cols-2 gap-2 md:gap-3">
            <Link to="/doctor/appointments">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                <Calendar className="h-6 w-6 text-primary" />
                <span>{t('nav.appointments')}</span>
              </Button>
            </Link>
            <Link to="/doctor/patients">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                <Users className="h-6 w-6 text-primary" />
                <span>{t('doctor.viewPatients')}</span>
              </Button>
            </Link>
            <Link to="/doctor/prescriptions/create">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                <FileText className="h-6 w-6 text-primary" />
                <span>{t('doctor.createPrescription')}</span>
              </Button>
            </Link>
            <Link to="/doctor/lab-requests/create">
              <Button variant="outline" className="w-full h-auto py-4 flex-col gap-2">
                <FlaskConical className="h-6 w-6 text-primary" />
                <span>{t('doctor.createLabRequest')}</span>
              </Button>
            </Link>
          </div>
        </GlassCard>

        {/* Upcoming Appointments */}
        <GlassCard hover>
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <h2 className="text-base md:text-lg font-semibold">{t('doctor.upcomingAppointments')}</h2>
            <Link to="/doctor/appointments">
              <Button variant="ghost" size="sm" className="text-primary">
                {t('common.view')}
                <ChevronRight className={cn("h-4 w-4 ms-1", i18n.language === 'ar' && "rotate-180")} />
              </Button>
            </Link>
          </div>

          {appointments.length > 0 ? (
            <div className="space-y-3">
              {appointments.slice(0, 5).map((appointment, index) => (
                <motion.div
                  key={appointment.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="flex items-center justify-between p-2.5 md:p-3 rounded-xl bg-secondary/10 hover:bg-secondary/20 transition-all border border-transparent hover:border-primary/20">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm md:text-base truncate">
                        {appointment.patientName || t('roles.patient')}
                      </p>
                      <p className="text-[11px] md:text-sm text-muted-foreground">
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
      </div>
    </DashboardLayout>
  );
}
