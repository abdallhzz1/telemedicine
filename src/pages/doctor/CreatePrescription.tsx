import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { useProfile } from '@/store/authStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createPrescription } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';

const prescriptionSchema = z.object({
  patientId: z.string().min(1, 'Patient ID is required'),
  medicines: z.array(z.object({
    name: z.string().min(1, 'Medicine name is required'),
    dose: z.string().min(1, 'Dose is required'),
    duration: z.string().min(1, 'Duration is required'),
    notes: z.string().optional(),
  })).min(1, 'At least one medicine is required'),
});

type PrescriptionForm = z.infer<typeof prescriptionSchema>;

export default function CreatePrescription() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const profile = useProfile();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PrescriptionForm>({
    resolver: zodResolver(prescriptionSchema),
    defaultValues: {
      patientId: searchParams.get('patientId') || '',
      medicines: [{ name: '', dose: '', duration: '', notes: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'medicines',
  });

  const onSubmit = async (data: PrescriptionForm) => {
    if (!profile?.uid) return;

    setIsSubmitting(true);
    try {
      const medicines = data.medicines.map(m => ({
        name: m.name,
        dose: m.dose,
        duration: m.duration,
        notes: m.notes || '',
      }));

      await createPrescription({
        patientId: data.patientId,
        doctorId: profile.uid,
        medicines,
      });
      toast({ title: t('messages.saveSuccess') });
      navigate('/doctor/prescriptions');
    } catch (error) {
      toast({ title: t('messages.errorOccurred'), variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader
        title={t('doctor.createPrescription')}
        description={t('doctor.createPrescriptionSubtitle')}
      />

      <GlassCard>
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

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>{t('doctor.medicines')}</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ name: '', dose: '', duration: '', notes: '' })}
              >
                <Plus className="h-4 w-4 me-1" />
                {t('doctor.addMedicine')}
              </Button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="p-4 rounded-lg bg-secondary/20 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t('doctor.medicineNumber', { number: index + 1 })}</span>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>{t('doctor.medicineName')}</Label>
                    <Input
                      {...register(`medicines.${index}.name`)}
                      placeholder={t('doctor.medicineNamePlaceholder')}
                    />
                    {errors.medicines?.[index]?.name && (
                      <p className="text-sm text-destructive">
                        {errors.medicines[index]?.name?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>{t('doctor.dose')}</Label>
                    <Input
                      {...register(`medicines.${index}.dose`)}
                      placeholder={t('doctor.dosePlaceholder')}
                    />
                    {errors.medicines?.[index]?.dose && (
                      <p className="text-sm text-destructive">
                        {errors.medicines[index]?.dose?.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>{t('doctor.duration')}</Label>
                    <Input
                      {...register(`medicines.${index}.duration`)}
                      placeholder={t('doctor.durationPlaceholder')}
                    />
                    {errors.medicines?.[index]?.duration && (
                      <p className="text-sm text-destructive">
                        {errors.medicines[index]?.duration?.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('doctor.notes')}</Label>
                  <Textarea
                    {...register(`medicines.${index}.notes`)}
                    placeholder={t('doctor.notesPlaceholder')}
                    rows={2}
                  />
                </div>
              </div>
            ))}
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
