import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Check, X, Clock, Eye, Video } from 'lucide-react';
import { useProfile } from '@/store/authStore';
import { useLangStore } from '@/store/langStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { PageLoading } from '@/components/ui/loading-spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getAppointments, updateAppointmentStatus, Appointment } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';
import { UserAvatar } from '@/components/common/UserAvatar';

export default function DoctorAppointments() {
  const { t, i18n } = useTranslation();
  const profile = useProfile();
  const { direction } = useLangStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState('all');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    appointmentId: string;
    action: 'confirm' | 'cancel' | 'complete';
  }>({ open: false, appointmentId: '', action: 'confirm' });

  const fetchAppointments = async () => {
    if (!profile?.uid) return;

    try {
      const data = await getAppointments(profile.uid, 'doctor', filter === 'all' ? undefined : filter);
      setAppointments(data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [profile?.uid, filter]);

  const handleStatusChange = async () => {
    try {
      const newStatus = confirmDialog.action === 'confirm' ? 'upcoming' :
        confirmDialog.action === 'cancel' ? 'cancelled' : 'completed';

      await updateAppointmentStatus(confirmDialog.appointmentId, newStatus);
      toast({ title: t('messages.statusUpdated') });
      fetchAppointments();
    } catch (error) {
      toast({ title: t('messages.errorOccurred'), variant: 'destructive' });
    } finally {
      setConfirmDialog({ open: false, appointmentId: '', action: 'confirm' });
    }
  };

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
        title={t('nav.appointments')}
        description={t('appointments.doctorSubtitle')}
      >
        <Button asChild variant="outline" className="gap-2">
          <Link to="/doctor/availability">
            <Clock className="h-4 w-4" />
            {t('appointments.manageAvailability')}
          </Link>
        </Button>
      </PageHeader>

      <Tabs dir={direction} value={filter} onValueChange={setFilter} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">{t('common.all')}</TabsTrigger>
          <TabsTrigger value="upcoming">{t('status.upcoming')}</TabsTrigger>
          <TabsTrigger value="completed">{t('status.completed')}</TabsTrigger>
          <TabsTrigger value="cancelled">{t('status.cancelled')}</TabsTrigger>
        </TabsList>
      </Tabs>

      <GlassCard className="overflow-hidden p-0">
        {appointments.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead>{t('appointments.patient')}</TableHead>
                    <TableHead>{t('appointments.date')}</TableHead>
                    <TableHead>{t('appointments.time')}</TableHead>
                    <TableHead>{t('appointments.status')}</TableHead>
                    <TableHead className="text-end">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {appointments.map((appointment) => (
                    <TableRow key={appointment.id} className="border-border/50">
                      <TableCell className="font-medium">
                        <UserAvatar userId={appointment.patientId} name={appointment.patientName} showName />
                      </TableCell>
                      <TableCell>
                        {format(appointment.dateTime, 'MMM dd, yyyy', { locale: i18n.language === 'ar' ? ar : undefined })}
                      </TableCell>
                      <TableCell>
                        {format(appointment.dateTime, 'HH:mm')}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={appointment.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          {appointment.status === 'upcoming' && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-primary hover:text-primary hover:bg-primary/10"
                                asChild
                              >
                                <Link to={`/video-room/${appointment.id}`}>
                                  <Video className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setConfirmDialog({
                                  open: true,
                                  appointmentId: appointment.id,
                                  action: 'complete'
                                })}
                                className="text-success hover:text-success"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setConfirmDialog({
                                  open: true,
                                  appointmentId: appointment.id,
                                  action: 'cancel'
                                })}
                                className="text-destructive hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
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
              {appointments.map((appointment) => (
                <div key={appointment.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-foreground">{appointment.patientName || t('roles.patient')}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(appointment.dateTime, 'MMM dd, yyyy • HH:mm', { locale: i18n.language === 'ar' ? ar : undefined })}
                      </p>
                    </div>
                    <StatusBadge status={appointment.status} className="text-[10px]" />
                  </div>

                  {appointment.status === 'upcoming' && (
                    <div className="flex gap-2 pt-1">
                      <Button asChild size="sm" className="flex-1 btn-gradient h-9">
                        <Link to={`/video-room/${appointment.id}`}>
                          <Video className="h-4 w-4 me-2" />
                          {t('appointments.joinCall')}
                        </Link>
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 px-3 text-success hover:bg-success/10"
                        onClick={() => setConfirmDialog({
                          open: true,
                          appointmentId: appointment.id,
                          action: 'complete'
                        })}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-9 px-3 text-destructive hover:bg-destructive/10"
                        onClick={() => setConfirmDialog({
                          open: true,
                          appointmentId: appointment.id,
                          action: 'cancel'
                        })}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            title={t('appointments.noAppointments')}
            description={t('appointments.noAppointmentsFilter')}
            className="py-16"
          />
        )}
      </GlassCard>

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent className="glass-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('common.confirm')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('appointments.confirmActionDesc', { action: t('common.' + confirmDialog.action).toLowerCase() })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusChange} className="btn-gradient">
              {t('common.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
