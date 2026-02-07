import { useTranslation } from 'react-i18next';
import { useProfile } from '@/store/authStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/glass-card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';

export default function AdminProfile() {
  const { t } = useTranslation();
  const profile = useProfile();

  return (
    <DashboardLayout>
      <PageHeader title={t('nav.profile')} />
      <GlassCard className="max-w-2xl mx-auto p-4 md:p-8">
        <div className="flex flex-col items-center text-center mb-6 md:mb-8">
          <Avatar className="h-20 w-20 md:h-24 md:w-24 mb-4 border-4 border-primary/20 p-1 shadow-glow font-bold">
            <AvatarImage src={profile?.avatar} />
            <AvatarFallback className="bg-primary/10 text-primary text-2xl">
              {profile?.fullName?.charAt(0) || 'A'}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-xl md:text-2xl font-bold text-foreground">{profile?.fullName}</h2>
          <Badge variant="secondary" className="mt-2 capitalize bg-primary/10 text-primary border-none font-bold text-[11px] md:text-xs px-3">
            {t(`roles.${profile?.role}`)}
          </Badge>
        </div>

        <div className="space-y-1 md:space-y-2">
          <div className="flex justify-between items-center py-3.5 md:py-4 border-b border-border/30">
            <span className="text-[11px] md:text-sm text-muted-foreground uppercase tracking-wider font-semibold">{t('auth.email')}</span>
            <span className="text-[13px] md:text-base font-medium">{profile?.email}</span>
          </div>
          <div className="flex justify-between items-center py-3.5 md:py-4 border-b border-border/30">
            <span className="text-[11px] md:text-sm text-muted-foreground uppercase tracking-wider font-semibold">{t('appointments.status')}</span>
            <StatusBadge status={profile?.status || 'active'} className="text-[10px]" />
          </div>
        </div>
      </GlassCard>
    </DashboardLayout>
  );
}
