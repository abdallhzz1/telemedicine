import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createPolicy } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';

const policySchema = z.object({ 
  title: z.string().min(1, 'Title is required'), 
  content: z.string().min(1, 'Content is required') 
});

type PolicyForm = z.infer<typeof policySchema>;

export default function CreatePolicy() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<PolicyForm>({ 
    resolver: zodResolver(policySchema) 
  });

  const onSubmit = async (data: PolicyForm) => {
    setIsSubmitting(true);
    try { 
      await createPolicy({ title: data.title, content: data.content }); 
      toast({ title: t('messages.saveSuccess') }); 
      navigate('/admin/policies'); 
    } catch (e) { 
      toast({ title: t('messages.errorOccurred'), variant: 'destructive' }); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  return (
    <DashboardLayout>
      <PageHeader title={t('admin.createPolicy')} />
      <GlassCard className="max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label>{t('admin.policyTitle')}</Label>
            <Input {...register('title')} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-2">
            <Label>{t('admin.policyContent')}</Label>
            <Textarea rows={8} {...register('content')} />
            {errors.content && <p className="text-sm text-destructive">{errors.content.message}</p>}
          </div>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>{t('common.cancel')}</Button>
            <Button type="submit" className="btn-gradient" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.save')}
            </Button>
          </div>
        </form>
      </GlassCard>
    </DashboardLayout>
  );
}
