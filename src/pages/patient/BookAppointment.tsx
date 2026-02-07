import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Calendar as CalendarIcon, Clock, User, Check, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { useProfile } from '@/store/authStore';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getUsers, getDoctorAvailability, createAppointment, getAppointments, Appointment } from '@/lib/firestore';
import { format, addDays, startOfDay, isEqual } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useDateFormatter } from '@/hooks/useDateFormatter';

export default function BookAppointment() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const profile = useProfile();
    const { toast } = useToast();
    const { format: formatLocalized } = useDateFormatter();

    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Step 1: Doctor Selection
    const [doctors, setDoctors] = useState<any[]>([]);
    const [selectedDoctor, setSelectedDoctor] = useState<any>(null);

    // Step 2: Date Selection
    const [selectedDate, setSelectedDate] = useState<Date>(addDays(new Date(), 1));

    // Step 3: Slot Selection
    const [availableSlots, setAvailableSlots] = useState<string[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<string>('');
    const [bookedAppointments, setBookedAppointments] = useState<Appointment[]>([]);

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const data = await getUsers('doctor');
                setDoctors(data);
            } catch (error) {
                console.error('Error fetching doctors:', error);
            }
        };
        fetchDoctors();
    }, []);

    useEffect(() => {
        const fetchAvailability = async () => {
            if (!selectedDoctor || !selectedDate) return;

            setLoading(true);
            try {
                // 1. Get doctor's weekly setup
                const availability = await getDoctorAvailability(selectedDoctor.id);
                if (!availability) {
                    setAvailableSlots([]);
                    setLoading(false);
                    return;
                }

                const dayName = format(selectedDate, 'eeee').toLowerCase();
                const daySlots = availability.weeklySlots[dayName] || [];

                // 2. Get already booked appointments for this doctor on this date
                // For demo, we'll fetch all upcoming for this doctor and filter
                const appts = await getAppointments(selectedDoctor.id, 'doctor');
                const dateAppts = appts.filter(a =>
                    isEqual(startOfDay(a.dateTime), startOfDay(selectedDate)) &&
                    a.status !== 'cancelled'
                );

                setBookedAppointments(dateAppts);

                // 3. Filter out booked slots
                const bookedTimes = dateAppts.map(a => format(a.dateTime, 'HH:mm'));
                setAvailableSlots(daySlots.filter(s => !bookedTimes.includes(s)));

            } catch (error) {
                console.error('Error fetching availability:', error);
            } finally {
                setLoading(false);
            }
        };

        if (step === 3) {
            fetchAvailability();
        }
    }, [selectedDoctor, selectedDate, step]);

    const handleConfirmBooking = async () => {
        if (!profile?.uid || !selectedDoctor || !selectedDate || !selectedSlot) return;

        setLoading(true);
        try {
            const [hours, minutes] = selectedSlot.split(':').map(Number);
            const apptDate = new Date(selectedDate);
            apptDate.setHours(hours, minutes, 0, 0);

            await createAppointment({
                patientId: profile.uid,
                patientName: profile.fullName,
                doctorId: selectedDoctor.id,
                doctorName: selectedDoctor.fullName,
                dateTime: apptDate,
                status: 'upcoming',
                notes: '',
            });

            toast({ title: t('appointments.bookingSuccess') });
            navigate('/patient/appointments');
        } catch (error) {
            console.error('Booking error:', error);
            toast({ title: t('messages.errorOccurred'), variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <PageHeader
                title={t('booking.title')}
                description={t('booking.subtitle')}
            />

            <div className="max-w-4xl mx-auto">
                {/* Stepper */}
                <div className="flex justify-between items-center mb-12 relative px-4">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border -translate-y-1/2 -z-10" />
                    {[1, 2, 3, 4].map((s) => (
                        <div key={s} className="flex flex-col items-center">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors ${step >= s ? 'bg-primary border-primary text-primary-foreground' : 'bg-background border-border text-muted-foreground'
                                }`}>
                                {step > s ? <Check className="h-5 w-5" /> : s}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Step Content */}
                <div className="min-h-[400px]">
                    {step === 1 && (
                        <GlassCard className="animate-in fade-in slide-in-from-bottom-4">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                {t('booking.selectDoctor')}
                            </h3>
                            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                {doctors.map((doc) => (
                                    <div
                                        key={doc.id}
                                        onClick={() => setSelectedDoctor(doc)}
                                        className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 cursor-pointer ${selectedDoctor?.id === doc.id
                                            ? 'border-primary bg-primary/10 shadow-glow'
                                            : 'border-white/5 hover:border-primary/50 bg-secondary/20 hover:bg-secondary/30'
                                            }`}
                                    >
                                        <div className="aspect-[4/3] relative overflow-hidden bg-secondary/30 flex items-center justify-center">
                                            {doc.avatar ? (
                                                <img
                                                    src={doc.avatar}
                                                    alt={doc.fullName}
                                                    className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                                                    <span className="text-4xl font-bold text-primary/50 group-hover:text-primary transition-colors">
                                                        {doc.fullName?.charAt(0).toUpperCase() || 'D'}
                                                    </span>
                                                </div>
                                            )}
                                            {/* Fallback div for when image fails to load - initially hidden */}
                                            <div className={`hidden absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20`}>
                                                <span className="text-4xl font-bold text-primary/50 group-hover:text-primary transition-colors">
                                                    {doc.fullName?.charAt(0).toUpperCase() || 'D'}
                                                </span>
                                            </div>
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                                            {selectedDoctor?.id === doc.id && (
                                                <div className="absolute top-3 right-3 bg-primary text-primary-foreground rounded-full p-1 animate-in zoom-in">
                                                    <Check className="h-4 w-4" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-5 relative">
                                            <h4 className="font-bold text-lg text-white mb-1 group-hover:text-primary transition-colors">
                                                {doc.fullName}
                                            </h4>
                                            <p className="text-sm text-slate-300 bg-white/5 inline-block px-2 py-1 rounded-md capitalize mb-2">
                                                {doc.specialization || t('booking.generalPractitioner')}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-8 flex justify-end">
                                <Button
                                    disabled={!selectedDoctor}
                                    onClick={() => setStep(2)}
                                    className="btn-gradient px-8"
                                >
                                    {t('booking.continue')} <ArrowRight className="h-4 w-4 ms-2 transform rtl:rotate-180" />
                                </Button>
                            </div>
                        </GlassCard>
                    )}

                    {step === 2 && (
                        <GlassCard className="animate-in fade-in slide-in-from-bottom-4">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <CalendarIcon className="h-5 w-5 text-primary" />
                                {t('booking.chooseDate')}
                            </h3>
                            <div className="flex flex-col items-center">
                                <Input
                                    type="date"
                                    min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                                    value={format(selectedDate, 'yyyy-MM-dd')}
                                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                                    className="max-w-xs input-glow text-lg py-6"
                                />
                                <p className="mt-4 text-muted-foreground">
                                    {t('booking.availableFrom')} {formatLocalized(addDays(new Date(), 1), 'PPP')}
                                </p>
                            </div>
                            <div className="mt-12 flex justify-between">
                                <Button variant="outline" onClick={() => setStep(1)}>
                                    <ArrowLeft className="h-4 w-4 me-2 transform rtl:rotate-180" /> {t('booking.back')}
                                </Button>
                                <Button onClick={() => setStep(3)} className="btn-gradient px-8">
                                    {t('booking.next')} <ArrowRight className="h-4 w-4 ms-2 transform rtl:rotate-180" />
                                </Button>
                            </div>
                        </GlassCard>
                    )}

                    {step === 3 && (
                        <GlassCard className="animate-in fade-in slide-in-from-bottom-4">
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                                <Clock className="h-5 w-5 text-primary" />
                                {t('booking.availableSlots')}
                            </h3>
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                                    <p>{t('booking.checkingAvailability')}</p>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-6">
                                        <p className="font-semibold text-lg">{formatLocalized(selectedDate, 'EEEE, MMMM do')}</p>
                                        <p className="text-sm text-muted-foreground">{t('booking.with')} {selectedDoctor?.fullName}</p>
                                    </div>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                        {availableSlots.length > 0 ? (
                                            availableSlots.map((slot) => (
                                                <button
                                                    key={slot}
                                                    onClick={() => setSelectedSlot(slot)}
                                                    className={`py-3 px-2 rounded-lg border text-sm font-medium transition-all ${selectedSlot === slot
                                                        ? 'bg-primary border-primary text-primary-foreground shadow-glow scale-105'
                                                        : 'bg-secondary/20 border-border/50 hover:border-primary/50'
                                                        }`}
                                                >
                                                    {slot}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="col-span-full py-12 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                                                {t('booking.noAvailability')}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                            <div className="mt-12 flex justify-between">
                                <Button variant="outline" onClick={() => setStep(2)}>
                                    <ArrowLeft className="h-4 w-4 me-2 transform rtl:rotate-180" /> {t('booking.back')}
                                </Button>
                                <Button
                                    disabled={!selectedSlot}
                                    onClick={() => setStep(4)}
                                    className="btn-gradient px-8"
                                >
                                    {t('booking.review')} <ArrowRight className="h-4 w-4 ms-2 transform rtl:rotate-180" />
                                </Button>
                            </div>
                        </GlassCard>
                    )}

                    {step === 4 && (
                        <GlassCard className="animate-in fade-in slide-in-from-bottom-4">
                            <h3 className="text-xl font-bold mb-8">{t('booking.confirm')}</h3>
                            <div className="space-y-6 bg-secondary/10 p-6 rounded-2xl border border-border/50">
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">{t('appointments.doctor')}</span>
                                    <span className="font-bold text-lg text-primary">{selectedDoctor?.fullName}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">{t('booking.specialization')}</span>
                                    <Badge variant="secondary" className="capitalize">
                                        {selectedDoctor?.specialization || t('booking.generalPractitioner')}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">{t('appointments.date')}</span>
                                    <span className="font-bold">{formatLocalized(selectedDate, 'PPPP')}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">{t('appointments.time')}</span>
                                    <span className="font-bold bg-primary/10 text-primary px-3 py-1 rounded-lg">{selectedSlot}</span>
                                </div>
                            </div>
                            <div className="mt-12 flex justify-between">
                                <Button variant="outline" onClick={() => setStep(3)}>
                                    <ArrowLeft className="h-4 w-4 me-2 transform rtl:rotate-180" /> {t('booking.back')}
                                </Button>
                                <Button
                                    onClick={handleConfirmBooking}
                                    disabled={loading}
                                    className="btn-gradient px-12 h-12 text-lg shadow-glow"
                                >
                                    {loading ? <Loader2 className="h-5 w-5 animate-spin me-2" /> : <Check className="h-5 w-5 me-2" />}
                                    {t('booking.bookNow')}
                                </Button>
                            </div>
                        </GlassCard>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
