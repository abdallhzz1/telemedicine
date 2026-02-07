import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, Plus, Trash2, Save, Loader2, Calendar } from 'lucide-react';
import { useProfile } from '@/store/authStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getDoctorAvailability, updateDoctorAvailability } from '@/lib/firestore';
import { useToast } from '@/hooks/use-toast';

const DAYS = [
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
];

export default function ManageAvailability() {
    const { t } = useTranslation();
    const profile = useProfile();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [days, setDays] = useState<Record<string, string[]>>({
        monday: [], tuesday: [], wednesday: [], thursday: [],
        friday: [], saturday: [], sunday: []
    });
    const [newSlot, setNewSlot] = useState({ day: 'monday', time: '' });

    useEffect(() => {
        const fetchAvailability = async () => {
            if (!profile?.uid) return;
            try {
                const data = await getDoctorAvailability(profile.uid);
                if (data?.weeklySlots) {
                    setDays(data.weeklySlots);
                }
            } catch (error) {
                console.error('Error fetching availability:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAvailability();
    }, [profile?.uid]);

    const addSlot = () => {
        if (!newSlot.time) return;

        // Sort slots after adding
        const updatedSlots = [...days[newSlot.day], newSlot.time].sort();
        // Remove duplicates
        const uniqueSlots = Array.from(new Set(updatedSlots));

        setDays({
            ...days,
            [newSlot.day]: uniqueSlots
        });
        setNewSlot({ ...newSlot, time: '' });
    };

    const removeSlot = (day: string, time: string) => {
        setDays({
            ...days,
            [day]: days[day].filter(s => s !== time)
        });
    };

    const saveAvailability = async () => {
        if (!profile?.uid) return;
        setSaving(true);
        try {
            await updateDoctorAvailability(profile.uid, days);
            toast({ title: t('messages.updateSuccess') });
        } catch (error) {
            console.error('Error saving availability:', error);
            toast({ title: t('messages.errorOccurred'), variant: 'destructive' });
        } finally {
            setSaving(false);
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
            <PageHeader
                title={t('availability.title')}
                description={t('availability.subtitle')}
            >
                <Button
                    onClick={saveAvailability}
                    disabled={saving}
                    className="btn-gradient px-8"
                >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Save className="h-4 w-4 me-2" />}
                    {t('availability.saveSchedule')}
                </Button>
            </PageHeader>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
                <GlassCard className="lg:col-span-1 h-fit p-4 md:p-6 shadow-glow">
                    <h3 className="text-base md:text-lg font-bold mb-6 flex items-center gap-2 text-primary">
                        <Plus className="h-4 w-4 md:h-5 md:w-5" />
                        {t('availability.addNewSlot')}
                    </h3>
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <label className="text-[11px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('availability.dayOfWeek')}</label>
                            <Select
                                value={newSlot.day}
                                onValueChange={(val) => setNewSlot({ ...newSlot, day: val })}
                            >
                                <SelectTrigger className="h-11 md:h-12 rounded-xl border-border/50 bg-secondary/10 hover:bg-secondary/20 transition-all font-medium">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="glass-card">
                                    {DAYS.map(day => (
                                        <SelectItem key={day} value={day} className="capitalize py-3">
                                            {t('daysList.' + day)}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] md:text-xs font-bold uppercase tracking-widest text-muted-foreground">{t('availability.timeSlot')}</label>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Clock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                                    <Input
                                        type="time"
                                        value={newSlot.time}
                                        onChange={(e) => setNewSlot({ ...newSlot, time: e.target.value })}
                                        className="h-11 md:h-12 ps-10 rounded-xl border-border/50 bg-secondary/10 focus:bg-secondary/20 transition-all font-bold"
                                    />
                                </div>
                                <Button onClick={addSlot} type="button" className="btn-gradient h-11 md:h-12 px-6 rounded-xl shadow-glow-sm">
                                    {t('availability.addSlot')}
                                </Button>
                            </div>
                        </div>
                    </div>
                </GlassCard>

                <div className="lg:col-span-2 space-y-4 md:space-y-5">
                    {DAYS.map(day => (
                        <GlassCard key={day} className="p-4 md:p-5 border-l-4 border-l-primary/50 group overflow-hidden relative">
                            <div className="hidden group-hover:block absolute -right-6 -top-6 w-16 h-16 bg-primary/5 rounded-full blur-2xl transition-all" />
                            <div className="flex items-center justify-between mb-4 relative z-10">
                                <h4 className="font-bold capitalize flex items-center gap-2 text-sm md:text-base">
                                    <Calendar className="h-4 w-4 text-primary" />
                                    {t('daysList.' + day)}
                                </h4>
                                <span className="text-[10px] md:text-xs bg-secondary/30 px-3 py-1 rounded-full text-muted-foreground font-medium">
                                    {t('availability.slotsCount', { count: days[day].length })}
                                </span>
                            </div>
                            <div className="flex flex-wrap gap-2 md:gap-3 relative z-10">
                                {days[day].length > 0 ? (
                                    days[day].map(time => (
                                        <div
                                            key={time}
                                            className="group/slot flex items-center gap-2 px-3.5 py-2 rounded-xl bg-background/40 border border-border/30 hover:border-primary/50 hover:bg-primary/5 transition-all shadow-sm"
                                        >
                                            <span className="text-xs md:text-sm font-bold text-foreground/80">{time}</span>
                                            <button
                                                onClick={() => removeSlot(day, time)}
                                                className="text-muted-foreground hover:text-destructive transition-colors p-1"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-[11px] md:text-xs text-muted-foreground italic bg-secondary/10 w-full py-4 rounded-xl text-center border border-dashed border-border/30">
                                        {t('availability.noSlots')}
                                    </p>
                                )}
                            </div>
                        </GlassCard>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
