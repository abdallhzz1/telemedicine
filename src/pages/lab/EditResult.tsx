import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Upload, FileText, ArrowLeft } from 'lucide-react';
import { uploadToCloudinary } from '@/lib/cloudinaryUpload';
import { db } from '@/lib/firebase';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { updateLabResult } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';
import { getDoc, doc } from 'firebase/firestore';

const editSchema = z.object({
    editedReason: z.string().min(10, 'Please provide a reason for editing (min 10 characters)'),
});

type EditForm = z.infer<typeof editSchema>;

export default function EditResult() {
    const { resultId } = useParams<{ resultId: string }>();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [currentResult, setCurrentResult] = useState<any>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<EditForm>({
        resolver: zodResolver(editSchema),
    });

    useEffect(() => {
        const fetchResult = async () => {
            if (!resultId) return;
            try {
                const docSnap = await getDoc(doc(db, 'labResults', resultId));
                if (docSnap.exists()) {
                    setCurrentResult({ id: docSnap.id, ...docSnap.data() });
                }
            } catch (error) {
                console.error('Error fetching result:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchResult();
    }, [resultId]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const onSubmit = async (data: EditForm) => {
        if (!resultId || !currentResult) return;

        setIsSubmitting(true);
        try {
            let fileUrl = currentResult.fileUrl;
            let publicId = currentResult.publicId;
            let resourceType = currentResult.resourceType;

            if (selectedFile) {
                // Upload new file to Cloudinary
                const cloudinaryData = await uploadToCloudinary(selectedFile, {
                    folder: 'telemedicine/labResults',
                });
                fileUrl = cloudinaryData.secureUrl;
                publicId = cloudinaryData.publicId;
                resourceType = cloudinaryData.resourceType;
            }

            // Update lab result record
            await updateLabResult(resultId, {
                fileUrl,
                publicId,
                resourceType,
                editedReason: data.editedReason,
                updatedAt: new Date(),
            });

            toast({ title: t('lab.updateSuccess') });
            navigate('/lab/results');
        } catch (error) {
            console.error('Update error:', error);
            toast({ title: t('messages.errorOccurred'), variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
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
            <div className="mb-4">
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    {t('common.back')}
                </Button>
            </div>

            <PageHeader
                title={t('lab.editResult')}
                description={t('lab.editSubtitle')}
            />

            <GlassCard className="max-w-xl">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="editedReason">{t('lab.editReason')}</Label>
                        <Textarea
                            id="editedReason"
                            placeholder={t('lab.editReasonPlaceholder')}
                            className="resize-none"
                            rows={4}
                            {...register('editedReason')}
                        />
                        {errors.editedReason && (
                            <p className="text-sm text-destructive">{errors.editedReason.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>{t('lab.newFileOptional')}</Label>
                        <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors">
                            <input
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg"
                                onChange={handleFileChange}
                                className="hidden"
                                id="file-upload"
                            />
                            <label htmlFor="file-upload" className="cursor-pointer">
                                {selectedFile ? (
                                    <div className="flex flex-col items-center gap-2">
                                        <FileText className="h-12 w-12 text-primary" />
                                        <p className="font-medium">{selectedFile.name}</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2">
                                        <Upload className="h-12 w-12 text-muted-foreground" />
                                        <p className="text-muted-foreground underline">
                                            {currentResult?.fileUrl ? t('lab.replaceFile') : t('lab.selectNewFile')}
                                        </p>
                                    </div>
                                )}
                            </label>
                        </div>
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
                                    <Upload className="h-4 w-4 me-2" />
                                    {t('lab.saveChanges')}
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </GlassCard>
        </DashboardLayout>
    );
}

// Missing component needs to be imported or defined
const PageLoading = () => (
    <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
);
