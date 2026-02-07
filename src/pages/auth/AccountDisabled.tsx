import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/glass-card';
import { logout } from '@/lib/auth';
import { useAuthStore } from '@/store/authStore';

export default function AccountDisabledPage() {
  const { t } = useTranslation();
  const logoutStore = useAuthStore((s) => s.logout);

  const handleLogout = async () => {
    await logout();
    logoutStore();
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="/bg-login.png"
          alt="Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px]" />

        {/* Background Watermark */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.05] z-0 overflow-hidden">
          <img
            src="/logo.png"
            alt="Watermark"
            className="w-[300px] md:w-[600px] h-[300px] md:h-[600px] object-contain grayscale"
          />
        </div>

        {/* Ambient Glow Effects */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-destructive/10 rounded-full blur-[120px] animate-pulse" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="w-full max-w-md relative z-10"
      >
        <GlassCard className="text-center border-destructive/20 shadow-glow-lg">
          <div className="w-20 h-20 rounded-full bg-destructive/20 mx-auto mb-6 flex items-center justify-center animate-pulse">
            <ShieldX className="h-10 w-10 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-4">{t('auth.accountDisabled')}</h1>
          <p className="text-muted-foreground mb-6">
            {t('auth.disabledLongDesc')}
          </p>
          <Button onClick={handleLogout} variant="outline" className="w-full">
            {t('auth.logout')}
          </Button>
        </GlassCard>
      </motion.div>
    </div>
  );
}
