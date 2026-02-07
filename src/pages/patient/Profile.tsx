import { useTranslation } from 'react-i18next';
import { User, Mail, Phone, MapPin, Edit2, Shield } from 'lucide-react';
import { useProfile } from '@/store/authStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { uploadToCloudinary } from '@/lib/cloudinaryUpload';
import { updateUserProfile } from '@/lib/firestore';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { resetPassword } from '@/lib/auth';

export default function PatientProfile() {
    const { t } = useTranslation();
    const profile = useProfile();
    const { setProfile } = useAuthStore();
    const { toast } = useToast();
    const [isUploading, setIsUploading] = useState(false);

    if (!profile) return null;

    const handleResetPassword = async () => {
        if (!profile?.email) return;
        try {
            await resetPassword(profile.email);
            toast({
                title: t('auth.emailSent'),
                description: t('auth.checkEmailReset'),
            });
        } catch (error) {
            toast({
                title: t('messages.errorOccurred'),
                variant: 'destructive'
            });
        }
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !profile?.uid) return;

        setIsUploading(true);
        try {
            const result = await uploadToCloudinary(file, {
                folder: 'telemedicine/profiles',
            });

            await updateUserProfile(profile.uid, {
                avatar: result.secureUrl,
            });

            // Update local state
            setProfile({ ...profile, avatar: result.secureUrl });

            toast({ title: t('messages.updateSuccess') });
        } catch (error) {
            console.error('Profile upload error:', error);
            toast({ title: t('messages.errorOccurred'), variant: 'destructive' });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <DashboardLayout>
            <PageHeader
                title={t('nav.profile')}
                description={t('profile.personalInfo')}
            >
                <Button className="btn-gradient gap-2">
                    <Edit2 className="h-4 w-4" />
                    {t('profile.editProfile')}
                </Button>
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                <GlassCard className="lg:col-span-1 h-fit p-4 md:p-6 shadow-glow">
                    <div className="flex flex-col items-center text-center">
                        <div className="relative group mb-6">
                            <Avatar className="h-24 w-24 md:h-32 md:w-32 border-4 border-primary/20 p-1 shadow-glow">
                                <AvatarImage src={profile.avatar} />
                                <AvatarFallback className="bg-primary/10 text-primary text-3xl font-bold">
                                    {profile.fullName.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <label
                                htmlFor="avatar-upload"
                                className="absolute inset-x-0 bottom-2 flex justify-center translate-y-1/2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity cursor-pointer z-10"
                            >
                                <div className="bg-primary text-primary-foreground p-2 rounded-full shadow-lg border-2 border-background">
                                    {isUploading ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Camera className="h-3.5 w-3.5" />
                                    )}
                                </div>
                            </label>
                            <input
                                id="avatar-upload"
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageUpload}
                                disabled={isUploading}
                            />
                        </div>
                        <h2 className="text-xl md:text-2xl font-bold text-foreground">{profile.fullName}</h2>
                        <p className="text-xs md:text-sm text-muted-foreground mb-4 opacity-70">{profile.email}</p>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-success/10 text-success text-[10px] md:text-xs font-bold border border-success/20">
                            <Shield className="h-3.5 w-3.5" />
                            {t('profile.verifiedPatient')}
                        </div>
                    </div>
                </GlassCard>

                <div className="lg:col-span-2 space-y-4 md:space-y-6">
                    <GlassCard className="p-4 md:p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg md:text-xl font-bold text-primary">{t('profile.contactDetails')}</h3>
                            <div className="h-1 w-12 bg-primary/20 rounded-full" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                            <div className="space-y-1">
                                <p className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-2 uppercase font-bold tracking-widest">
                                    <Mail className="h-3.5 w-3.5" /> {t('profile.emailAddress')}
                                </p>
                                <p className="font-semibold text-sm md:text-base break-all">{profile.email}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-2 uppercase font-bold tracking-widest">
                                    <Phone className="h-3.5 w-3.5" /> {t('profile.phoneNumber')}
                                </p>
                                <p className="font-semibold text-sm md:text-base">{profile.phone || '+970 XX-XXXXXXX'}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-2 uppercase font-bold tracking-widest">
                                    <MapPin className="h-3.5 w-3.5" /> {t('profile.address')}
                                </p>
                                <p className="font-semibold text-sm md:text-base">Hebron, Palestine</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[10px] md:text-xs text-muted-foreground flex items-center gap-2 uppercase font-bold tracking-widest">
                                    {t('profile.patientId')}
                                </p>
                                <div className="font-mono text-[10px] md:text-xs bg-secondary/20 p-2.5 rounded-xl border border-border/30 truncate">
                                    {profile.uid}
                                </div>
                            </div>
                        </div>
                    </GlassCard>

                    <GlassCard className="bg-gradient-to-br from-accent/5 to-transparent border-accent/20 p-4 md:p-8">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg md:text-xl font-bold text-accent">{t('profile.accountSecurity')}</h3>
                            <div className="h-1 w-12 bg-accent/20 rounded-full" />
                        </div>
                        <div className="space-y-3 md:space-y-4">
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-background/30 border border-border/30 hover:bg-background/50 transition-all">
                                <div>
                                    <p className="font-bold text-sm md:text-base">{t('auth.password')}</p>
                                    <p className="text-[10px] md:text-xs text-muted-foreground opacity-70">{t('profile.securedEncrypted')}</p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleResetPassword}
                                    className="h-8 md:h-9 text-[10px] md:text-xs rounded-xl px-4 border-accent/30 text-accent hover:bg-accent/10"
                                >
                                    {t('profile.change')}
                                </Button>
                            </div>
                        </div>
                    </GlassCard>
                </div>
            </div>
        </DashboardLayout>
    );
}
