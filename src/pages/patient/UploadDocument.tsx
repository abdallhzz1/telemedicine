import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Upload, FileText, ArrowLeft } from 'lucide-react';
import { useProfile } from '@/store/authStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { uploadToCloudinary } from '@/lib/cloudinaryUpload';
import { createUpload } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';

const uploadSchema = z.object({
    doctorId: z.string().optional(),
    note: z.string().optional(),
});

type UploadForm = z.infer<typeof uploadSchema>;

export default function UploadDocument() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const profile = useProfile();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<UploadForm>({
        resolver: zodResolver(uploadSchema),
        defaultValues: {
            doctorId: searchParams.get('doctorId') || '',
            note: '',
        },
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const onSubmit = async (data: UploadForm) => {
        if (!profile?.uid) return;
        if (!selectedFile) {
            toast({ title: t('upload.selectFileError'), variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        try {
            // Upload file to Cloudinary
            const cloudinaryData = await uploadToCloudinary(selectedFile, {
                folder: 'telemedicine/uploads',
            });

            // Create upload record
            await createUpload({
                patientId: profile.uid,
                doctorId: data.doctorId || undefined,
                fileUrl: cloudinaryData.secureUrl,
                publicId: cloudinaryData.publicId,
                resourceType: cloudinaryData.resourceType,
                fileType: selectedFile.type.startsWith('image/') ? 'image' : 'pdf',
                note: data.note,
            });

            toast({ title: t('messages.saveSuccess') });
            navigate('/patient');
        } catch (error) {
            console.error('Upload error:', error);
            toast({ title: t('messages.errorOccurred'), variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="mb-4">
                <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    {t('common.back')}
                </Button>
            </div>

            <PageHeader
                title={t('upload.title')}
                description={t('upload.subtitle')}
            />

            <GlassCard className="max-w-xl mx-auto p-4 md:p-8">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-4">
                        <Label className="text-sm font-bold text-foreground/80">{t('lab.selectFile')}</Label>
                        <div className="group relative">
                            <input
                                type="file"
                                accept=".pdf,.png,.jpg,.jpeg"
                                onChange={handleFileChange}
                                className="hidden"
                                id="file-upload"
                            />
                            <label
                                htmlFor="file-upload"
                                className="flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-2xl p-8 md:p-12 text-center hover:border-primary hover:bg-primary/5 transition-all cursor-pointer bg-secondary/5"
                            >
                                {selectedFile ? (
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="p-4 rounded-full bg-primary/20 text-primary animate-in zoom-in-50 duration-300">
                                            <FileText className="h-8 w-8 md:h-10 md:w-10" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-sm md:text-base text-foreground mb-1">{selectedFile.name}</p>
                                            <p className="text-[11px] md:text-xs text-muted-foreground bg-secondary/30 px-3 py-1 rounded-full text-center inline-block">
                                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="p-4 rounded-full bg-secondary/10 text-muted-foreground group-hover:text-primary transition-colors">
                                            <Upload className="h-8 w-8 md:h-10 md:w-10" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-sm md:text-base text-foreground mb-1">
                                                {t('upload.selectDocument')}
                                            </p>
                                            <p className="text-[11px] md:text-xs text-muted-foreground opacity-70">
                                                PDF, PNG, JPG (max 10MB)
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </label>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="note" className="text-sm font-bold text-foreground/80">{t('upload.notesOptional')}</Label>
                        <Textarea
                            id="note"
                            placeholder={t('upload.notePlaceholder')}
                            rows={3}
                            {...register('note')}
                            className="rounded-xl border-border/50 bg-secondary/5 focus:bg-secondary/10 transition-all resize-none"
                        />
                    </div>

                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => navigate(-1)}
                            className="w-full sm:w-auto h-11 md:h-12 border-none text-muted-foreground hover:bg-secondary/20 rounded-xl"
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            className="w-full sm:w-auto btn-gradient h-11 md:h-12 px-8 rounded-xl shadow-glow-sm transition-all hover:scale-[1.02]"
                            disabled={isSubmitting || !selectedFile}
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    <Upload className="h-5 w-5 me-2" />
                                    {t('upload.uploadButton')}
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </GlassCard>
        </DashboardLayout>
    );
}
