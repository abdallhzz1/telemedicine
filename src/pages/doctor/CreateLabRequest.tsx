import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { useProfile } from '@/store/authStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createLabRequest, getLabs } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';
import { DocumentData } from 'firebase/firestore';
import { PageLoading } from '@/components/ui/loading-spinner';

const labRequestSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  labId: z.string().min(1, 'Please select a laboratory'),
  testType: z.string().min(1, 'Test type is required'),
  notes: z.string().optional(),
});

type LabRequestForm = z.infer<typeof labRequestSchema>;

export default function CreateLabRequest() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const profile = useProfile();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [labs, setLabs] = useState<DocumentData[]>([]);
  const [loadingLabs, setLoadingLabs] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LabRequestForm>({
    resolver: zodResolver(labRequestSchema),
    defaultValues: {
      patientId: searchParams.get('patientId') || '',
      labId: '',
      testType: '',
      notes: '',
    },
  });

  const selectedLabId = watch('labId');

  useEffect(() => {
    const fetchLabs = async () => {
      try {
        const data = await getLabs();
        setLabs(data);
      } catch (error) {
        console.error('Error fetching labs:', error);
      } finally {
        setLoadingLabs(false);
      }
    };

    fetchLabs();
  }, []);

  const onSubmit = async (data: LabRequestForm) => {
    if (!profile?.uid) return;

    setIsSubmitting(true);
    try {
      await createLabRequest({
        patientId: data.patientId,
        doctorId: profile.uid,
        labId: data.labId,
        testType: data.testType,
        notes: data.notes,
        status: 'new',
      });
      toast({ title: t('messages.saveSuccess') });
      navigate('/doctor/lab-requests');
    } catch (error) {
      toast({ title: t('messages.errorOccurred'), variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loadingLabs) {
    return (
      <DashboardLayout>
        <PageLoading />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title={t('doctor.createLabRequest')}
        description={t('doctor.createLabRequestSubtitle')}
      />

      <GlassCard className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="patientId">{t('doctor.selectPatient')}</Label>
            <Input
              id="patientId"
              placeholder={t('doctor.patientIdPlaceholder')}
              {...register('patientId')}
            />
            {errors.patientId && (
              <p className="text-sm text-destructive">{errors.patientId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t('doctor.selectLab')}</Label>
            <Select value={selectedLabId} onValueChange={(value) => setValue('labId', value)}>
              <SelectTrigger>
                <SelectValue placeholder={t('doctor.selectLabPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {labs.map((lab) => (
                  <SelectItem key={lab.id} value={lab.id}>
                    {lab.labName || lab.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.labId && (
              <p className="text-sm text-destructive">{errors.labId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="testType">{t('doctor.testType')}</Label>
            <Input
              id="testType"
              placeholder={t('doctor.testTypePlaceholder')}
              {...register('testType')}
            />
            {errors.testType && (
              <p className="text-sm text-destructive">{errors.testType.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t('doctor.notes')}</Label>
            <Textarea
              id="notes"
              placeholder={t('doctor.labNotesPlaceholder')}
              rows={4}
              {...register('notes')}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              className="btn-gradient"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t('common.save')
              )}
            </Button>
          </div>
        </form>
      </GlassCard>
    </DashboardLayout>
  );
}
