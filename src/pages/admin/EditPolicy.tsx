import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Save, ArrowLeft, Trash2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { updatePolicy, deletePolicy } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const policySchema = z.object({
    title: z.string().min(3, 'Title is required (min 3 chars)'),
    content: z.string().min(10, 'Content is required (min 10 chars)'),
});

type PolicyForm = z.infer<typeof policySchema>;

export default function EditPolicy() {
    const { policyId } = useParams<{ policyId: string }>();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<PolicyForm>({
        resolver: zodResolver(policySchema),
    });

    useEffect(() => {
        const fetchPolicy = async () => {
            if (!policyId) return;
            try {
                const docSnap = await getDoc(doc(db, 'policies', policyId));
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    reset({
                        title: data.title,
                        content: data.content,
                    });
                }
            } catch (error) {
                console.error('Error fetching policy:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPolicy();
    }, [policyId, reset]);

    const onSubmit = async (data: PolicyForm) => {
        if (!policyId) return;
        setIsSubmitting(true);
        try {
            await updatePolicy(policyId, data);
            toast({ title: 'Policy updated successfully' });
            navigate('/admin/policies');
        } catch (error) {
            toast({ title: t('messages.errorOccurred'), variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!policyId) return;
        try {
            await deletePolicy(policyId);
            toast({ title: 'Policy deleted successfully' });
            navigate('/admin/policies');
        } catch (error) {
            toast({ title: 'Failed to delete policy', variant: 'destructive' });
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="mb-4">
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    {t('common.back')}
                </Button>
            </div>

            <PageHeader
                title={t('admin.editPolicy')}
                description={t('admin.editPolicyDesc')}
            >
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-destructive border-destructive/50 hover:bg-destructive/10">
                            <Trash2 className="h-4 w-4 me-2" />
                            {t('admin.deletePolicy')}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="glass-card">
                        <AlertDialogHeader>
                            <AlertDialogTitle>{t('admin.deleteDialogTitle')}</AlertDialogTitle>
                            <AlertDialogDescription>
                                {t('admin.deleteDialogDesc')}
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel className="bg-secondary/20">{t('common.cancel')}</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                {t('common.delete')}
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </PageHeader>

            <GlassCard className="max-w-2xl">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="title">{t('admin.policyTitle')}</Label>
                        <Input
                            id="title"
                            placeholder="e.g. Terms of Service"
                            {...register('title')}
                        />
                        {errors.title && (
                            <p className="text-sm text-destructive">{errors.title.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="content">{t('admin.policyContent')}</Label>
                        <Textarea
                            id="content"
                            placeholder="Enter policy content here..."
                            className="min-h-[300px] resize-none"
                            {...register('content')}
                        />
                        {errors.content && (
                            <p className="text-sm text-destructive">{errors.content.message}</p>
                        )}
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
                                <>
                                    <Save className="h-4 w-4 me-2" />
                                    {t('admin.savePolicy')}
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </GlassCard>
        </DashboardLayout>
    );
}
