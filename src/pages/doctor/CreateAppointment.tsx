import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Calendar, Clock, User, Loader2, ArrowLeft } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createAppointment, getPatientsForDoctor } from '@/lib/firestore';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';

const appointmentSchema = z.object({
    patientId: z.string().min(1, 'Patient is required'),
    date: z.string().min(1, 'Date is required'),
    time: z.string().min(1, 'Time is required'),
    notes: z.string().optional(),
});

type AppointmentForm = z.infer<typeof appointmentSchema>;

export default function CreateAppointment() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const prefilledPatientId = searchParams.get('patientId');
    const { toast } = useToast();
    const profile = useAuthStore(s => s.profile);
    const [patients, setPatients] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetchingPatients, setIsFetchingPatients] = useState(true);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors },
    } = useForm<AppointmentForm>({
        resolver: zodResolver(appointmentSchema),
        defaultValues: {
            patientId: prefilledPatientId || '',
        }
    });

    const selectedPatientId = watch('patientId');

    useEffect(() => {
        const fetchPatients = async () => {
            if (!profile?.uid) return;
            try {
                const data = await getPatientsForDoctor(profile.uid);
                setPatients(data);
            } catch (error) {
                console.error('Error fetching patients:', error);
            } finally {
                setIsFetchingPatients(false);
            }
        };

        fetchPatients();
    }, [profile?.uid]);

    const onSubmit = async (data: AppointmentForm) => {
        if (!profile?.uid) return;

        setIsLoading(true);
        try {
            const dateTime = new Date(`${data.date}T${data.time}`);
            const selectedPatient = patients.find(p => p.uid === data.patientId);

            await createAppointment({
                doctorId: profile.uid,
                doctorName: profile.fullName,
                patientId: data.patientId,
                patientName: selectedPatient?.fullName || 'Patient',
                dateTime,
                status: 'upcoming',
                notes: data.notes || '',
            });

            toast({ title: 'Appointment created successfully' });
            navigate('/doctor/appointments');
        } catch (error) {
            console.error('Error creating appointment:', error);
            toast({ title: t('messages.errorOccurred'), variant: 'destructive' });
        } finally {
            setIsLoading(false);
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
                title="Schedule Appointment"
                description="Book a new consultation for your patient"
            />

            <GlassCard className="max-w-2xl mx-auto">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                        <Label>Patient</Label>
                        <Select
                            value={selectedPatientId}
                            onValueChange={(val) => setValue('patientId', val)}
                            disabled={!!prefilledPatientId}
                        >
                            <SelectTrigger className="input-glow">
                                <SelectValue placeholder="Select a patient" />
                            </SelectTrigger>
                            <SelectContent>
                                {patients.map((p) => (
                                    <SelectItem key={p.uid} value={p.uid}>
                                        {p.fullName}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.patientId && (
                            <p className="text-sm text-destructive">{errors.patientId.message}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="date">Date</Label>
                            <div className="relative">
                                <Calendar className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="date"
                                    type="date"
                                    className="ps-10 input-glow"
                                    {...register('date')}
                                />
                            </div>
                            {errors.date && (
                                <p className="text-sm text-destructive">{errors.date.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="time">Time</Label>
                            <div className="relative">
                                <Clock className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="time"
                                    type="time"
                                    className="ps-10 input-glow"
                                    {...register('time')}
                                />
                            </div>
                            {errors.time && (
                                <p className="text-sm text-destructive">{errors.time.message}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea
                            id="notes"
                            placeholder="Add any instructions or notes for this appointment..."
                            className="input-glow min-h-[100px]"
                            {...register('notes')}
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => navigate(-1)}
                        >
                            {t('common.cancel')}
                        </Button>
                        <Button
                            type="submit"
                            className="btn-gradient px-8"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    <Calendar className="h-4 w-4 me-2" />
                                    Book Appointment
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </GlassCard>
        </DashboardLayout>
    );
}
