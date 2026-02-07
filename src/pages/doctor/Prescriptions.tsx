import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { Plus, Pill } from 'lucide-react';
import { useProfile } from '@/store/authStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { PageLoading } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { getPrescriptions, Prescription } from '@/lib/firestore';
import { motion } from 'framer-motion';

export default function DoctorPrescriptions() {
  const { t } = useTranslation();
  const profile = useProfile();
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  useEffect(() => {
    const fetchPrescriptions = async () => {
      if (!profile?.uid) return;

      try {
        const data = await getPrescriptions(profile.uid, 'doctor');
        setPrescriptions(data);
      } catch (error) {
        console.error('Error fetching prescriptions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptions();
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
      <PageHeader title={t('nav.prescriptions')}>
        <Link to="/doctor/prescriptions/create">
          <Button className="btn-gradient">
            <Plus className="h-4 w-4 me-2" />
            {t('doctor.createPrescription')}
          </Button>
        </Link>
      </PageHeader>

      {prescriptions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {prescriptions.map((prescription, index) => (
            <motion.div
              key={prescription.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <GlassCard hover className="h-full flex flex-col p-4 md:p-6 border-s-4 border-s-accent">
                <div className="flex items-start justify-between mb-4 md:mb-6">
                  <div className="min-w-0 pe-2">
                    <p className="font-bold text-sm md:text-base truncate">
                      {prescription.patientName
                        ? t('doctor.prescriptions.patient', { name: prescription.patientName })
                        : t('doctor.prescriptions.patient', { name: prescription.patientId.slice(0, 8) })}
                    </p>
                    <p className="text-[11px] md:text-sm text-muted-foreground opacity-70 flex items-center gap-1 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                      {format(prescription.createdAt, 'MMM dd, yyyy • HH:mm')}
                    </p>
                  </div>
                  <div className="p-2 md:p-3 rounded-xl bg-accent/10 text-accent shrink-0">
                    <Pill className="h-4 w-4 md:h-5 md:w-5" />
                  </div>
                </div>

                <div className="space-y-2 md:space-y-3 flex-1">
                  {prescription.medicines.slice(0, 3).map((medicine, idx) => (
                    <div
                      key={idx}
                      className="group flex items-center justify-between p-2.5 rounded-xl bg-secondary/5 border border-border/30 hover:bg-secondary/10 transition-colors"
                    >
                      <div className="min-w-0 pe-2">
                        <p className="font-semibold text-[13px] md:text-sm truncate">{medicine.name}</p>
                        <p className="text-[10px] md:text-[11px] text-muted-foreground opacity-70">{medicine.dose}</p>
                      </div>
                      <span className="text-[10px] md:text-[11px] font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full shrink-0">
                        {medicine.duration}
                      </span>
                    </div>
                  ))}
                  {prescription.medicines.length > 3 && (
                    <div className="pt-2">
                      <p className="text-[11px] md:text-xs text-muted-foreground text-center bg-secondary/10 py-1.5 rounded-lg border border-dashed border-border/50">
                        {t('doctor.prescriptions.moreMedicines', { count: prescription.medicines.length - 3 })}
                      </p>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-border/30 flex justify-end">
                  <Button variant="ghost" size="sm" className="h-8 text-[11px] md:text-xs text-primary hover:bg-primary/10 rounded-xl" asChild>
                    <Link to={`/doctor/patients/${prescription.patientId}`}>
                      {t('doctor.prescriptions.viewHistory')}
                    </Link>
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      ) : (
        <GlassCard>
          <EmptyState
            icon={Pill}
            title={t('common.noData')}
            description={t('doctor.prescriptions.noPrescriptions')}
            action={
              <Link to="/doctor/prescriptions/create">
                <Button className="btn-gradient">
                  <Plus className="h-4 w-4 me-2" />
                  {t('doctor.createPrescription')}
                </Button>
              </Link>
            }
          />
        </GlassCard>
      )}
    </DashboardLayout>
  );
}
