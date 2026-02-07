import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TestTube, FileText, Download, Eye, Calendar, User, UserCheck } from 'lucide-react';
import { useProfile } from '@/store/authStore';
import { useLangStore } from '@/store/langStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/glass-card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoading } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getLabResultsForLab, LabRequest, LabResult } from '@/lib/firestore';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { motion } from 'framer-motion';

type CombinedResult = LabRequest & { result?: LabResult };

export default function LabResults() {
  const { t, i18n } = useTranslation();
  const profile = useProfile();
  const { direction } = useLangStore();
  const [loading, setLoading] = useState(true);
  const [results, setResults] = useState<CombinedResult[]>([]);

  useEffect(() => {
    const fetchResults = async () => {
      if (!profile?.uid) return;
      try {
        const data = await getLabResultsForLab(profile.uid);
        setResults(data);
      } catch (error) {
        console.error('Error fetching lab results:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
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
        title={t('nav.results')}
        description={t('lab.resultsHistory')}
      />

      <GlassCard className="overflow-hidden p-0">
        {results.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead>{t('lab.testType')}</TableHead>
                    <TableHead>{t('appointments.patient')}</TableHead>
                    <TableHead>{t('appointments.doctor')}</TableHead>
                    <TableHead>{t('appointments.date')}</TableHead>
                    <TableHead className="text-end">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((item) => (
                    <TableRow key={item.id} className="border-border/50">
                      <TableCell className="font-medium">{item.testType}</TableCell>
                      <TableCell>{item.patientName || t('common.unknown')}</TableCell>
                      <TableCell>{item.doctorName || t('common.unknown')}</TableCell>
                      <TableCell>
                        {format(item.createdAt, 'MMM dd, yyyy', {
                          locale: i18n.language === 'ar' ? ar : undefined
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          {item.result?.fileUrl ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-primary hover:bg-primary/10 rounded-xl gap-2"
                              asChild
                            >
                              <a href={item.result.fileUrl} target="_blank" rel="noopener noreferrer">
                                <Download className="h-4 w-4" />
                                {t('common.view')}
                              </a>
                            </Button>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">
                              {t('lab.noFile')}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-border/30">
              {results.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="min-w-0 pe-2">
                      <p className="font-bold text-foreground text-sm md:text-base truncate">
                        {item.testType}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        <span>
                          {format(item.createdAt, 'MMM dd, yyyy', {
                            locale: i18n.language === 'ar' ? ar : undefined
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      <TestTube className="h-4 w-4" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 py-1">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wider">
                        <User className="h-3 w-3" />
                        <span>{t('appointments.patient')}</span>
                      </div>
                      <p className="text-xs font-semibold truncate">{item.patientName || t('common.unknown')}</p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground uppercase tracking-wider">
                        <UserCheck className="h-3 w-3" />
                        <span>{t('appointments.doctor')}</span>
                      </div>
                      <p className="text-xs font-semibold truncate">{item.doctorName || t('common.unknown')}</p>
                    </div>
                  </div>

                  <div className="pt-2">
                    {item.result?.fileUrl ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-primary border-primary/20 hover:bg-primary/5 rounded-xl gap-2 h-9"
                        asChild
                      >
                        <a href={item.result.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4" />
                          {t('common.view')} {t('lab.result')}
                        </a>
                      </Button>
                    ) : (
                      <p className="text-center text-[11px] text-muted-foreground italic py-1 bg-secondary/10 rounded-lg">
                        {t('lab.noFile')}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            icon={TestTube}
            title={t('common.noData')}
            description={t('lab.noUploadedResults')}
            className="py-16"
          />
        )}
      </GlassCard>
    </DashboardLayout>
  );
}
