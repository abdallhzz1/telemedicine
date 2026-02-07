import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Calendar,
  Users,
  FileText,
  FlaskConical,
  TestTube,
  MessageSquare,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Shield,
  BarChart3,
  ClipboardList,
  Brain,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore, useProfile } from '@/store/authStore';
import { useLangStore } from '@/store/langStore';
import { logout } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

interface NavItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

const doctorNavItems: NavItem[] = [
  { label: 'nav.home', icon: Home, path: '/doctor' },
  { label: 'nav.appointments', icon: Calendar, path: '/doctor/appointments' },
  { label: 'nav.patients', icon: Users, path: '/doctor/patients' },
  { label: 'nav.prescriptions', icon: FileText, path: '/doctor/prescriptions' },
  { label: 'nav.labRequests', icon: FlaskConical, path: '/doctor/lab-requests' },
  { label: 'nav.labResults', icon: TestTube, path: '/doctor/lab-results' },
  { label: 'nav.aiModels', icon: Brain, path: '/doctor/ai-models' },
  { label: 'nav.chat', icon: MessageSquare, path: '/doctor/chat' },
  { label: 'nav.profile', icon: User, path: '/doctor/profile' },
];

const labNavItems: NavItem[] = [
  { label: 'nav.home', icon: Home, path: '/lab' },
  { label: 'nav.requests', icon: ClipboardList, path: '/lab/requests' },
  { label: 'nav.results', icon: TestTube, path: '/lab/results' },
  { label: 'nav.profile', icon: User, path: '/lab/profile' },
];

const adminNavItems: NavItem[] = [
  { label: 'nav.home', icon: Home, path: '/admin' },
  { label: 'nav.users', icon: Users, path: '/admin/users' },
  { label: 'nav.policies', icon: Shield, path: '/admin/policies' },
  { label: 'nav.statistics', icon: BarChart3, path: '/admin/statistics' },
  { label: 'nav.profile', icon: User, path: '/admin/profile' },
];

const patientNavItems: NavItem[] = [
  { label: 'nav.home', icon: Home, path: '/patient' },
  { label: 'nav.appointments', icon: Calendar, path: '/patient/appointments' },
  { label: 'nav.prescriptions', icon: FileText, path: '/patient/prescriptions' },
  { label: 'nav.labResults', icon: FlaskConical, path: '/patient/lab-results' },
  { label: 'nav.chat', icon: MessageSquare, path: '/patient/chat' },
  { label: 'nav.profile', icon: User, path: '/patient/profile' },
];

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const profile = useProfile();
  const { direction, toggleLanguage, language } = useLangStore();
  const logoutStore = useAuthStore((s) => s.logout);

  const getNavItems = (): NavItem[] => {
    switch (profile?.role) {
      case 'doctor':
        return doctorNavItems;
      case 'lab':
        return labNavItems;
      case 'admin':
        return adminNavItems;
      case 'patient':
        return patientNavItems;
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  const handleLogout = async () => {
    try {
      await logout();
      logoutStore();
      toast({ title: t('messages.logoutSuccess') });
      navigate('/login');
    } catch (error) {
      toast({ title: t('messages.errorOccurred'), variant: 'destructive' });
    }
  };

  const isActive = (path: string) => {
    if (path === location.pathname) return true;
    if (path !== '/' && location.pathname.startsWith(path + '/')) return true;
    return false;
  };

  const CollapseIcon = direction === 'rtl'
    ? (collapsed ? ChevronLeft : ChevronRight)
    : (collapsed ? ChevronRight : ChevronLeft);

  return (
    <div className="min-h-screen flex bg-background overflow-x-hidden w-full relative">
      {/* Background Image & Overlay */}
      <div className="fixed inset-0 z-0">
        <img
          src="/bg-login.png"
          alt="Background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px]" />

        {/* Background Watermark */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-[0.05] z-0 overflow-hidden">
          <img
            src="/logo.png"
            alt="Watermark"
            className="w-[300px] md:w-[600px] h-[300px] md:h-[600px] object-contain grayscale"
          />
        </div>

        {/* Ambient Glow Effects */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent/20 rounded-full blur-[120px] animate-pulse" />
      </div>

      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col fixed top-0 h-screen bg-sidebar-background/95 backdrop-blur-xl border-r border-sidebar-border z-40 transition-all duration-500 ease-in-out shadow-2xl',
          direction === 'rtl' ? 'right-0' : 'left-0',
          collapsed ? 'w-20' : 'w-72'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                <img src="/logo.png" alt="Telemedicine" className="w-8 h-8 rounded-lg object-contain" />
                <span className="font-semibold text-foreground">Telemedicine</span>
              </motion.div>
            )}
          </AnimatePresence>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCollapsed(!collapsed)}
            className="text-muted-foreground hover:text-foreground"
          >
            <CollapseIcon className="h-5 w-5" />
          </Button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 py-4 overflow-y-auto">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                    isActive(item.path)
                      ? 'sidebar-item-active'
                      : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
                  )}
                >
                  <item.icon className="h-5 w-5 flex-shrink-0" />
                  <AnimatePresence mode="wait">
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        className="whitespace-nowrap"
                      >
                        {t(item.label)}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-sidebar-border">
          <div className={cn('flex items-center gap-3', collapsed && 'justify-center')}>
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatar} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {profile?.fullName?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 min-w-0"
                >
                  <p className="text-sm font-medium truncate">{profile?.fullName}</p>
                  <p className="text-xs text-muted-foreground capitalize">{t(`roles.${profile?.role}`)}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Button
            variant="ghost"
            size={collapsed ? 'icon' : 'default'}
            onClick={handleLogout}
            className={cn('mt-4 w-full text-destructive hover:bg-destructive/10 group transition-all', collapsed ? 'px-0' : 'justify-start px-3')}
          >
            <LogOut className="h-4 w-4 transition-transform group-hover:scale-110" />
            {!collapsed && <span className="ms-2 font-medium">{t('auth.logout')}</span>}
          </Button>
        </div>
      </aside>

      {/* Mobile Header - Compact & Premium */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-transparent backdrop-blur-2xl border-b border-border z-40 flex items-center justify-between px-4">
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} className="hover:bg-primary/10">
          <Menu className="h-6 w-6 text-primary" />
        </Button>
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Telemedicine" className="w-8 h-8 rounded-lg object-contain" />
          <span className="font-bold tracking-tight text-foreground uppercase text-xs">Telemedicine</span>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={toggleLanguage} className="text-[10px] font-bold h-8 px-2">
            {language === 'en' ? 'AR' : 'EN'}
          </Button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: direction === 'rtl' ? '100%' : '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: direction === 'rtl' ? '100%' : '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className={cn(
                'lg:hidden fixed top-0 bottom-0 w-80 bg-sidebar-background/95 backdrop-blur-2xl border-sidebar-border z-50 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col',
                direction === 'rtl' ? 'right-0 border-l' : 'left-0 border-r'
              )}
            >
              <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
                <div className="flex items-center gap-2">
                  <img src="/logo.png" alt="Telemedicine" className="w-8 h-8 rounded-lg object-contain" />
                  <span className="font-semibold">Telemedicine</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <nav className="flex-1 py-4 overflow-y-auto">
                <ul className="space-y-1 px-2">
                  {navItems.map((item) => (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        onClick={() => setMobileOpen(false)}
                        className={cn(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200',
                          isActive(item.path)
                            ? 'sidebar-item-active'
                            : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        <span>{t(item.label)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="p-4 border-t border-sidebar-border">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile?.avatar} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {profile?.fullName?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{profile?.fullName}</p>
                    <p className="text-xs text-muted-foreground capitalize">{t(`roles.${profile?.role}`)}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  onClick={handleLogout}
                  className="w-full text-destructive hover:bg-destructive/10"
                >
                  <LogOut className="h-4 w-4 me-2" />
                  {t('auth.logout')}
                </Button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main
        className={cn(
          'flex-1 min-h-screen transition-all duration-500 ease-in-out',
          direction === 'rtl' ? (collapsed ? 'lg:mr-20' : 'lg:mr-72') : (collapsed ? 'lg:ml-20' : 'lg:ml-72'),
          'pt-16 lg:pt-0 pb-10'
        )}
      >
        {/* Desktop Top Bar */}
        <header className="hidden lg:flex h-16 items-center justify-between px-6 border-b border-border bg-transparent backdrop-blur-sm sticky top-0 z-30">
          <div />
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={toggleLanguage} className="text-muted-foreground">
              {language === 'en' ? 'العربية' : 'English'}
            </Button>
          </div>
        </header>

        <div className="p-3 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
