import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Search, UserPlus, Mail, Phone, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { searchPatients, addPatientToDoctor, getPatientsForDoctor } from '@/lib/firestore';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function FindPatient() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { toast } = useToast();
    const profile = useAuthStore(s => s.profile);

    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [myPatientIds, setMyPatientIds] = useState<string[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isAdding, setIsAdding] = useState<string | null>(null);

    // Fetch current patients to identify who is already added
    useEffect(() => {
        const fetchMyPatients = async () => {
            if (!profile?.uid) return;
            try {
                const myPatients = await getPatientsForDoctor(profile.uid);
                setMyPatientIds(myPatients.map(p => p.id || p.uid));
            } catch (e) {
                console.error(e);
            }
        };
        fetchMyPatients();
    }, [profile?.uid]);

    const handleSearch = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            const data = await searchPatients(searchQuery);
            setResults(data);
        } catch (error) {
            toast({ title: t('findPatient.searchError'), variant: "destructive" });
        } finally {
            setIsSearching(false);
        }
    };

    const handleAddPatient = async (patientId: string) => {
        if (!profile?.uid) return;

        setIsAdding(patientId);
        try {
            await addPatientToDoctor(profile.uid, patientId);
            setMyPatientIds(prev => [...prev, patientId]);
            toast({ title: t('findPatient.addSuccess') });
        } catch (error) {
            toast({ title: t('findPatient.addError'), variant: "destructive" });
        } finally {
            setIsAdding(null);
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
                title={t('findPatient.title')}
                description={t('findPatient.subtitle')}
            />

            <div className="max-w-3xl mx-auto space-y-8">
                {/* Search Bar */}
                <GlassCard>
                    <form onSubmit={handleSearch} className="flex gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder={t('findPatient.searchHint')}
                                className="ps-10 input-glow h-11"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button type="submit" className="btn-gradient min-w-[100px] h-11" disabled={isSearching}>
                            {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.search')}
                        </Button>
                    </form>
                </GlassCard>

                {/* Results Area */}
                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {results.length > 0 ? (
                            results.map((patient, index) => {
                                const isAlreadyAdded = myPatientIds.includes(patient.id || patient.uid);
                                return (
                                    <motion.div
                                        key={patient.id || patient.uid}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <GlassCard className="flex flex-col sm:flex-row items-center justify-between p-4 md:px-6 hover:bg-secondary/10 border-border/30 gap-4">
                                            <div className="flex items-center gap-3 md:gap-4 w-full sm:w-auto">
                                                <Avatar className="h-10 w-10 md:h-12 md:w-12 border border-primary/20 shrink-0">
                                                    <AvatarImage src={patient.avatar} />
                                                    <AvatarFallback className="bg-primary/5 text-primary">
                                                        {patient.fullName?.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="min-w-0 flex-1">
                                                    <h4 className="font-bold text-base md:text-lg truncate">{patient.fullName}</h4>
                                                    <div className="flex flex-col lg:flex-row lg:gap-4 text-[11px] md:text-xs text-muted-foreground mt-0.5 opacity-80">
                                                        <span className="flex items-center gap-1.5 truncate">
                                                            <Mail className="h-3 w-3 shrink-0" />
                                                            {patient.email}
                                                        </span>
                                                        {patient.phone && (
                                                            <span className="flex items-center gap-1.5 truncate">
                                                                <Phone className="h-3 w-3 shrink-0" />
                                                                {patient.phone}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="w-full sm:w-auto shrink-0">
                                                {isAlreadyAdded ? (
                                                    <div className="flex items-center justify-center gap-2 text-success font-bold bg-success/10 px-4 py-2 rounded-xl text-[11px]">
                                                        <CheckCircle2 className="h-4 w-4" />
                                                        {t('findPatient.addedToNetwork')}
                                                    </div>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        className="w-full sm:w-auto btn-gradient gap-2 h-10 px-5 rounded-xl text-xs"
                                                        onClick={() => handleAddPatient(patient.id || patient.uid)}
                                                        disabled={isAdding === (patient.id || patient.uid)}
                                                    >
                                                        {isAdding === (patient.id || patient.uid) ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <UserPlus className="h-4 w-4" />
                                                                {t('findPatient.addPatient')}
                                                            </>
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        </GlassCard>
                                    </motion.div>
                                );
                            })
                        ) : searchQuery && !isSearching ? (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-12 opacity-50"
                            >
                                <p>{t('findPatient.noPatientsFound')}</p>
                            </motion.div>
                        ) : null}
                    </AnimatePresence>
                </div>
            </div>
        </DashboardLayout>
    );
}
