import { useTranslation } from 'react-i18next';
import { useProfile } from '@/store/authStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/glass-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Camera, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { uploadToCloudinary } from '@/lib/cloudinaryUpload';
import { updateUserProfile } from '@/lib/firestore';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';

export default function LabProfile() {
  const { t } = useTranslation();
  const profile = useProfile();
  const { setProfile } = useAuthStore();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

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
      <PageHeader title={t('nav.profile')} />

      <GlassCard className="max-w-2xl mx-auto p-4 md:p-8">
        <div className="flex flex-col items-center text-center mb-6 md:mb-8">
          <div className="relative group mb-4">
            <Avatar className="h-20 w-20 md:h-24 md:w-24 border-4 border-primary/20 p-1 shadow-glow font-bold">
              <AvatarImage src={profile?.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                {profile?.labName?.charAt(0) || profile?.fullName?.charAt(0) || 'L'}
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
          <h2 className="text-xl md:text-2xl font-bold text-foreground">{profile?.labName || profile?.fullName}</h2>
          <Badge variant="secondary" className="mt-2 capitalize bg-primary/10 text-primary border-none font-bold text-[11px] md:text-xs px-3">
            {t(`roles.${profile?.role}`)}
          </Badge>
        </div>

        <div className="space-y-1 md:space-y-2">
          <div className="flex justify-between items-center py-3.5 md:py-4 border-b border-border/30">
            <span className="text-[11px] md:text-sm text-muted-foreground uppercase tracking-wider font-semibold">{t('auth.email')}</span>
            <span className="text-[13px] md:text-base font-medium">{profile?.email}</span>
          </div>
          {profile?.phone && (
            <div className="flex justify-between items-center py-3.5 md:py-4 border-b border-border/30">
              <span className="text-[11px] md:text-sm text-muted-foreground uppercase tracking-wider font-semibold">{t('profile.phoneNumber')}</span>
              <span className="text-[13px] md:text-base font-medium">{profile.phone}</span>
            </div>
          )}
          <div className="flex justify-between items-center py-3.5 md:py-4 border-b border-border/30">
            <span className="text-[11px] md:text-sm text-muted-foreground uppercase tracking-wider font-semibold">{t('appointments.status')}</span>
            <StatusBadge status={profile?.status || 'active'} className="text-[10px]" />
          </div>
        </div>
      </GlassCard>
    </DashboardLayout>
  );
}
