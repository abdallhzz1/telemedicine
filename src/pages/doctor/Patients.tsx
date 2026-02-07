import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, Eye, MessageSquare, FileText, FlaskConical } from 'lucide-react';
import { useProfile } from '@/store/authStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PageLoading } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { getPatientsForDoctor } from '@/lib/firestore';
import { DocumentData } from 'firebase/firestore';
import { motion } from 'framer-motion';

export default function DoctorPatients() {
  const { t } = useTranslation();
  const profile = useProfile();
  const [loading, setLoading] = useState(true);
  const [patients, setPatients] = useState<DocumentData[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchPatients = async () => {
      if (!profile?.uid) return;

      try {
        const data = await getPatientsForDoctor(profile.uid);
        setPatients(data);
      } catch (error) {
        console.error('Error fetching patients:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [profile?.uid]);

  const filteredPatients = patients.filter(patient =>
    patient.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <DashboardLayout>
        <PageLoading />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader title={t('nav.patients')}>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-10"
            />
          </div>
          <Link to="/doctor/patients/find">
            <Button className="btn-gradient w-full sm:w-auto">
              {t('common.add')} {t('nav.patients')}
            </Button>
          </Link>
        </div>
      </PageHeader>

      {filteredPatients.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {filteredPatients.map((patient, index) => (
            <motion.div
              key={patient.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <GlassCard hover className="h-full p-4 md:p-5">
                <div className="flex items-center gap-3 md:gap-4 mb-4">
                  <Avatar className="h-10 w-10 md:h-12 md:w-12 border-2 border-primary/20">
                    <AvatarImage src={patient.avatar} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {patient.fullName?.charAt(0) || 'P'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm md:text-base truncate">{patient.fullName}</h3>
                    <p className="text-[11px] md:text-sm text-muted-foreground truncate opacity-80">{patient.email}</p>
                    {patient.phone && (
                      <p className="text-[11px] md:text-sm text-muted-foreground opacity-80 truncate">{patient.phone}</p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 mt-auto">
                  <Link to={`/doctor/patients/${patient.id}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full h-8 md:h-9 text-[11px] md:text-xs gap-1.5 border-primary/30 hover:bg-primary/10 hover:text-primary">
                      <Eye className="h-3.5 w-3.5" />
                      {t('common.view')}
                    </Button>
                  </Link>
                  <Link to={`/doctor/prescriptions/create?patientId=${patient.id}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full h-8 md:h-9 text-[11px] md:text-xs gap-1.5 border-primary/30 hover:bg-primary/10 hover:text-primary">
                      <FileText className="h-3.5 w-3.5" />
                      {t('clinical.rx')}
                    </Button>
                  </Link>
                  <Link to={`/doctor/lab-requests/create?patientId=${patient.id}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full h-8 md:h-9 text-[11px] md:text-xs gap-1.5 border-primary/30 hover:bg-primary/10 hover:text-primary">
                      <FlaskConical className="h-3.5 w-3.5" />
                      {t('clinical.lab')}
                    </Button>
                  </Link>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      ) : (
        <GlassCard>
          <EmptyState
            title={t('common.noData')}
            description={t('clinical.noPatientsDesc')}
          />
        </GlassCard>
      )}
    </DashboardLayout>
  );
}
