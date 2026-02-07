import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { FlaskConical, Upload, Eye } from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getLabRequests, updateLabRequestStatus, LabRequest } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { UserAvatar } from '@/components/common/UserAvatar';

export default function LabRequests() {
  const { t } = useTranslation();
  const profile = useProfile();
  const { toast } = useToast();
  const { direction } = useLangStore();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<LabRequest[]>([]);
  const [filter, setFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState<LabRequest | null>(null);

  const fetchRequests = async () => {
    if (!profile?.uid) return;

    try {
      const data = await getLabRequests(profile.uid, 'lab', filter === 'all' ? undefined : filter);
      setRequests(data);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [profile?.uid, filter]);

  const handleStatusChange = async (requestId: string, newStatus: string) => {
    try {
      await updateLabRequestStatus(requestId, newStatus);
      toast({ title: t('messages.statusUpdated') });
      fetchRequests();
    } catch (error) {
      toast({ title: t('messages.errorOccurred'), variant: 'destructive' });
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
      <PageHeader title={t('nav.requests')} />

      <Tabs dir={direction} value={filter} onValueChange={setFilter} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">{t('common.all')}</TabsTrigger>
          <TabsTrigger value="new">{t('status.new')}</TabsTrigger>
          <TabsTrigger value="in_progress">{t('status.inProgress')}</TabsTrigger>
          <TabsTrigger value="ready">{t('status.ready')}</TabsTrigger>
          <TabsTrigger value="rejected">{t('status.rejected')}</TabsTrigger>
        </TabsList>
      </Tabs>

      <GlassCard className="overflow-hidden p-0">
        {requests.length > 0 ? (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead>Test Type</TableHead>
                    <TableHead>Patient</TableHead>
                    <TableHead>Doctor</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-end">{t('common.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id} className="border-border/50">
                      <TableCell className="font-medium">{request.testType}</TableCell>
                      <TableCell>
                        <UserAvatar userId={request.patientId} name={request.patientName} showName />
                      </TableCell>
                      <TableCell>
                        <UserAvatar userId={request.doctorId} name={request.doctorName} showName />
                      </TableCell>
                      <TableCell>{format(request.createdAt, 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <StatusBadge status={request.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setSelectedRequest(request)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {(request.status === 'new' || request.status === 'in_progress') && (
                            <Link to={`/lab/results/upload?requestId=${request.id}`}>
                              <Button size="sm" variant="ghost" className="text-primary hover:bg-primary/10">
                                <Upload className="h-4 w-4" />
                              </Button>
                            </Link>
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
              {requests.map((request) => (
                <div key={request.id} className="p-4 space-y-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0 pr-2">
                      <p className="font-bold text-foreground truncate">{request.testType}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t('appointments.patient')}: {request.patientName || t('common.unknown')}
                      </p>
                    </div>
                    <StatusBadge status={request.status} className="text-[10px]" />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <p className="text-[11px] text-muted-foreground">
                      {format(request.createdAt, 'MMM dd, yyyy')}
                    </p>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => setSelectedRequest(request)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {(request.status === 'new' || request.status === 'in_progress') && (
                        <Button asChild size="sm" variant="ghost" className="h-8 px-2 text-primary hover:bg-primary/10">
                          <Link to={`/lab/results/upload?requestId=${request.id}`}>
                            <Upload className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <EmptyState
            icon={FlaskConical}
            title={t('common.noData')}
            description="No lab requests found"
            className="py-16"
          />
        )}
      </GlassCard>

      {/* Request Details Dialog */}
      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent className="glass-card border-border">
          <DialogHeader>
            <DialogTitle>{t('lab.requestDetails')}</DialogTitle>
            <DialogDescription>View and update request status</DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t('lab.testType')}</p>
                  <p className="font-medium">{selectedRequest.testType}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('status.status')}</p>
                  <StatusBadge status={selectedRequest.status} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{t('appointments.date')}</p>
                  <p>{format(selectedRequest.createdAt, 'MMM dd, yyyy HH:mm')}</p>
                </div>
              </div>

              {selectedRequest.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">{t('doctor.notes')}</p>
                  <p>{selectedRequest.notes}</p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">{t('status.updateStatus')}</p>
                <Select
                  value={selectedRequest.status}
                  onValueChange={(value) => handleStatusChange(selectedRequest.id, value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">{t('status.new')}</SelectItem>
                    <SelectItem value="in_progress">{t('status.inProgress')}</SelectItem>
                    <SelectItem value="ready">{t('status.ready')}</SelectItem>
                    <SelectItem value="rejected">{t('status.rejected')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRequest(null)}>
              {t('common.cancel')}
            </Button>
            {selectedRequest && selectedRequest.status !== 'ready' && (
              <Link to={`/lab/results/upload?requestId=${selectedRequest.id}`}>
                <Button className="btn-gradient">
                  <Upload className="h-4 w-4 me-2" />
                  {t('lab.uploadResult')}
                </Button>
              </Link>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
