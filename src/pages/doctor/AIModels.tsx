import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Brain, Activity, Thermometer, Heart, Stethoscope, AlertCircle, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { checkHealth, predictClassical, predictQuantum, type MLHealthResponse } from '@/lib/mlApi';

// Symptom definitions with Arabic translations
const SYMPTOMS = [
    { key: 'symptom_fever', label: 'حمى', labelEn: 'Fever', icon: Thermometer },
    { key: 'symptom_cough', label: 'سعال', labelEn: 'Cough', icon: Activity },
    { key: 'symptom_sore_throat', label: 'التهاب الحلق', labelEn: 'Sore Throat', icon: Activity },
    { key: 'symptom_diarrhea', label: 'إسهال', labelEn: 'Diarrhea', icon: Activity },
    { key: 'symptom_vomiting', label: 'قيء', labelEn: 'Vomiting', icon: Activity },
    { key: 'symptom_rash', label: 'طفح جلدي', labelEn: 'Rash', icon: Activity },
    { key: 'symptom_headache', label: 'صداع', labelEn: 'Headache', icon: Activity },
    { key: 'symptom_dizziness', label: 'دوخة', labelEn: 'Dizziness', icon: Activity },
    { key: 'symptom_chest_pain', label: 'ألم صدر', labelEn: 'Chest Pain', icon: Heart },
    { key: 'symptom_palpitations', label: 'خفقان', labelEn: 'Palpitations', icon: Heart },
    { key: 'symptom_dysuria', label: 'صعوبة التبول', labelEn: 'Dysuria', icon: Activity },
    { key: 'symptom_freq_urination', label: 'كثرة التبول', labelEn: 'Frequent Urination', icon: Activity },
    { key: 'symptom_joint_pain', label: 'ألم مفاصل', labelEn: 'Joint Pain', icon: Activity },
    { key: 'symptom_back_pain', label: 'ألم ظهر', labelEn: 'Back Pain', icon: Activity },
    { key: 'symptom_ear_pain', label: 'ألم أذن', labelEn: 'Ear Pain', icon: Activity },
    { key: 'symptom_runny_nose', label: 'سيلان أنف', labelEn: 'Runny Nose', icon: Activity },
    { key: 'symptom_eye_redness', label: 'احمرار العين', labelEn: 'Eye Redness', icon: Activity },
    { key: 'symptom_fatigue', label: 'إرهاق', labelEn: 'Fatigue', icon: Activity },
];

// Vital signs definitions
const VITALS = [
    { key: 'temp_c', label: 'درجة الحرارة (°C)', labelEn: 'Temperature (°C)', min: 35, max: 42, step: 0.1, default: 37 },
    { key: 'spo2', label: 'نسبة الأكسجين (%)', labelEn: 'SpO2 (%)', min: 80, max: 100, step: 1, default: 98 },
    { key: 'heart_rate', label: 'نبض القلب', labelEn: 'Heart Rate', min: 40, max: 200, step: 1, default: 80 },
];

// Patient info dropdowns
const PATIENT_INFO = {
    triage_level: {
        label: 'مستوى الفرز',
        labelEn: 'Triage Level',
        options: [
            { value: 1, label: 'طوارئ', labelEn: 'Emergency' },
            { value: 2, label: 'عاجل', labelEn: 'Urgent' },
            { value: 3, label: 'عادي', labelEn: 'Normal' },
        ]
    },
    visit_mode: {
        label: 'نوع الزيارة',
        labelEn: 'Visit Mode',
        options: [
            { value: 0, label: 'حضوري', labelEn: 'In-Person' },
            { value: 1, label: 'عن بعد', labelEn: 'Remote' },
        ]
    },
    region_id: {
        label: 'المنطقة',
        labelEn: 'Region',
        options: [
            { value: 1, label: 'المنطقة 1', labelEn: 'Region 1' },
            { value: 2, label: 'المنطقة 2', labelEn: 'Region 2' },
            { value: 3, label: 'المنطقة 3', labelEn: 'Region 3' },
        ]
    },
    age_group: {
        label: 'الفئة العمرية',
        labelEn: 'Age Group',
        options: [
            { value: 0, label: 'طفل (0-12)', labelEn: 'Child (0-12)' },
            { value: 1, label: 'مراهق (13-18)', labelEn: 'Teen (13-18)' },
            { value: 2, label: 'بالغ (19-40)', labelEn: 'Adult (19-40)' },
            { value: 3, label: 'متوسط العمر (41-60)', labelEn: 'Middle Age (41-60)' },
            { value: 4, label: 'كبير السن (60+)', labelEn: 'Senior (60+)' },
        ]
    },
    gender: {
        label: 'الجنس',
        labelEn: 'Gender',
        options: [
            { value: 0, label: 'ذكر', labelEn: 'Male' },
            { value: 1, label: 'أنثى', labelEn: 'Female' },
        ]
    },
};

const CHRONIC_CONDITIONS = [
    { key: 'chronic_diabetes', label: 'سكري', labelEn: 'Diabetes' },
    { key: 'chronic_hypertension', label: 'ضغط الدم', labelEn: 'Hypertension' },
];

const RISK_GROUPS = [
    { value: 0, label: 'منخفض', labelEn: 'Low' },
    { value: 1, label: 'متوسط', labelEn: 'Medium' },
    { value: 2, label: 'مرتفع', labelEn: 'High' },
];

// Disease name translations (Arabic and English)
const DISEASE_TRANSLATIONS: Record<string, { ar: string; en: string }> = {
    'general_fever': { ar: 'حمى عامة', en: 'General Fever' },
    'respiratory_infection': { ar: 'التهاب تنفسي', en: 'Respiratory Infection' },
    'gastrointestinal': { ar: 'اضطراب هضمي', en: 'Gastrointestinal Issue' },
    'urinary_infection': { ar: 'التهاب مسالك بولية', en: 'Urinary Infection' },
    'cardiovascular': { ar: 'مشكلة قلبية', en: 'Cardiovascular Issue' },
    'cardio': { ar: 'مشكلة قلبية', en: 'Cardiovascular Issue' },
    'musculoskeletal': { ar: 'مشكلة عضلية/مفصلية', en: 'Musculoskeletal Issue' },
    'neurological': { ar: 'مشكلة عصبية', en: 'Neurological Issue' },
    'dermatological': { ar: 'مشكلة جلدية', en: 'Dermatological Issue' },
    'ent': { ar: 'أنف وأذن وحنجرة', en: 'ENT Issue' },
    'ophthalmological': { ar: 'مشكلة في العين', en: 'Ophthalmological Issue' },
    'general_checkup': { ar: 'فحص عام', en: 'General Checkup' },
    'respiratory': { ar: 'مشكلة تنفسية', en: 'Respiratory Issue' },
    'infectious': { ar: 'مرض معدي', en: 'Infectious Disease' },
    'metabolic': { ar: 'مشكلة أيضية', en: 'Metabolic Issue' },
};

export default function AIModels() {
    const { t, i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';

    // State
    const [apiStatus, setApiStatus] = useState<MLHealthResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [predicting, setPredicting] = useState(false);
    const [result, setResult] = useState<{ prediction: string; probabilities?: number[] } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selectedModel, setSelectedModel] = useState<'classical' | 'quantum'>('classical');

    // Form state
    const [symptoms, setSymptoms] = useState<Record<string, boolean>>({});
    const [vitals, setVitals] = useState<Record<string, number>>({
        temp_c: 37,
        spo2: 98,
        heart_rate: 80,
    });
    const [patientInfo, setPatientInfo] = useState({
        triage_level: 3,
        visit_mode: 0,
        region_id: 1,
        age_group: 2,
        gender: 0,
    });
    const [chronicConditions, setChronicConditions] = useState<Record<string, boolean>>({});
    const [riskGroup, setRiskGroup] = useState(0);

    // Check API health on mount
    useEffect(() => {
        const checkApiHealth = async () => {
            try {
                const response = await checkHealth();
                setApiStatus(response);
            } catch (err) {
                setError('فشل الاتصال بخدمة الذكاء الاصطناعي');
            } finally {
                setLoading(false);
            }
        };
        checkApiHealth();
    }, []);

    // Build features array in correct order
    const buildFeatures = (): number[] => {
        return [
            // Symptoms (18)
            symptoms['symptom_fever'] ? 1 : 0,
            symptoms['symptom_cough'] ? 1 : 0,
            symptoms['symptom_sore_throat'] ? 1 : 0,
            symptoms['symptom_diarrhea'] ? 1 : 0,
            symptoms['symptom_vomiting'] ? 1 : 0,
            symptoms['symptom_rash'] ? 1 : 0,
            symptoms['symptom_headache'] ? 1 : 0,
            symptoms['symptom_dizziness'] ? 1 : 0,
            symptoms['symptom_chest_pain'] ? 1 : 0,
            symptoms['symptom_palpitations'] ? 1 : 0,
            symptoms['symptom_dysuria'] ? 1 : 0,
            symptoms['symptom_freq_urination'] ? 1 : 0,
            symptoms['symptom_joint_pain'] ? 1 : 0,
            symptoms['symptom_back_pain'] ? 1 : 0,
            symptoms['symptom_ear_pain'] ? 1 : 0,
            symptoms['symptom_runny_nose'] ? 1 : 0,
            symptoms['symptom_eye_redness'] ? 1 : 0,
            symptoms['symptom_fatigue'] ? 1 : 0,
            // Vitals (3)
            vitals.temp_c,
            vitals.spo2,
            vitals.heart_rate,
            // Patient info (5)
            patientInfo.triage_level,
            patientInfo.visit_mode,
            patientInfo.region_id,
            patientInfo.age_group,
            patientInfo.gender,
            // Chronic conditions (2)
            chronicConditions['chronic_diabetes'] ? 1 : 0,
            chronicConditions['chronic_hypertension'] ? 1 : 0,
            // Risk group (1)
            riskGroup,
        ];
    };

    const handlePredict = async (modelType: 'classical' | 'quantum') => {
        setPredicting(true);
        setSelectedModel(modelType);
        setError(null);
        setResult(null);

        try {
            const features = buildFeatures();
            const response = modelType === 'classical'
                ? await predictClassical(features)
                : await predictQuantum(features);
            setResult({
                prediction: response.prediction,
                probabilities: response.probabilities,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'فشل التنبؤ');
        } finally {
            setPredicting(false);
        }
    };

    const handleReset = () => {
        setSymptoms({});
        setVitals({ temp_c: 37, spo2: 98, heart_rate: 80 });
        setPatientInfo({ triage_level: 3, visit_mode: 0, region_id: 1, age_group: 2, gender: 0 });
        setChronicConditions({});
        setRiskGroup(0);
        setResult(null);
        setError(null);
    };

    const translateDisease = (disease: string): { ar: string; en: string } => {
        return DISEASE_TRANSLATIONS[disease] || { ar: disease, en: disease };
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center h-96">
                    <LoadingSpinner size="lg" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            {/* Page Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <Brain className="w-8 h-8 text-primary" />
                    <h1 className="text-3xl font-bold">{isRTL ? 'نماذج الذكاء الاصطناعي' : 'AI Models'}</h1>
                </div>
                <p className="text-muted-foreground">{isRTL ? 'تحليل الأعراض والتنبؤ بالتشخيص باستخدام الذكاء الاصطناعي' : 'Analyze symptoms and predict diagnosis using AI'}</p>
            </div>

            {/* API Status */}
            <GlassCard className="mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Stethoscope className="w-6 h-6 text-primary" />
                        <span className="font-medium">{isRTL ? 'حالة النظام' : 'System Status'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        {apiStatus?.models_loaded?.classical ? (
                            <span className="flex items-center gap-1 text-green-400">
                                <CheckCircle className="w-4 h-4" />
                                {isRTL ? 'النموذج جاهز' : 'Model Ready'}
                            </span>
                        ) : (
                            <span className="flex items-center gap-1 text-red-400">
                                <AlertCircle className="w-4 h-4" />
                                {isRTL ? 'النموذج غير متاح' : 'Model Unavailable'}
                            </span>
                        )}
                    </div>
                </div>
            </GlassCard>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Symptoms Section */}
                <GlassCard className="lg:col-span-2">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" />
                        {isRTL ? 'الأعراض' : 'Symptoms'}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {SYMPTOMS.map((symptom) => (
                            <label
                                key={symptom.key}
                                className={`flex items-center gap-2 p-3 rounded-lg cursor-pointer transition-all ${symptoms[symptom.key]
                                    ? 'bg-primary/20 border-2 border-primary'
                                    : 'bg-secondary/20 border-2 border-transparent hover:bg-secondary/40'
                                    }`}
                            >
                                <input
                                    type="checkbox"
                                    checked={symptoms[symptom.key] || false}
                                    onChange={(e) => setSymptoms({ ...symptoms, [symptom.key]: e.target.checked })}
                                    className="hidden"
                                />
                                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${symptoms[symptom.key] ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                                    }`}>
                                    {symptoms[symptom.key] && <CheckCircle className="w-4 h-4 text-white" />}
                                </div>
                                <span className="text-sm">{isRTL ? symptom.label : symptom.labelEn}</span>
                            </label>
                        ))}
                    </div>
                </GlassCard>

                {/* Vitals & Patient Info */}
                <div className="space-y-6">
                    {/* Vitals */}
                    <GlassCard>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Heart className="w-5 h-5 text-destructive" />
                            {isRTL ? 'العلامات الحيوية' : 'Vitals'}
                        </h3>
                        <div className="space-y-4">
                            {VITALS.map((vital) => (
                                <div key={vital.key}>
                                    <label className="block text-sm text-muted-foreground mb-1">
                                        {isRTL ? vital.label : vital.labelEn}
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="range"
                                            min={vital.min}
                                            max={vital.max}
                                            step={vital.step}
                                            value={vitals[vital.key]}
                                            onChange={(e) => setVitals({ ...vitals, [vital.key]: parseFloat(e.target.value) })}
                                            className="flex-1"
                                        />
                                        <span className="w-16 text-center font-mono bg-secondary rounded px-2 py-1">
                                            {vitals[vital.key]}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </GlassCard>

                    {/* Chronic Conditions */}
                    <GlassCard>
                        <h3 className="text-lg font-semibold mb-4">
                            {isRTL ? 'الأمراض المزمنة' : 'Chronic Conditions'}
                        </h3>
                        <div className="space-y-2">
                            {CHRONIC_CONDITIONS.map((condition) => (
                                <label
                                    key={condition.key}
                                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all ${chronicConditions[condition.key]
                                        ? 'bg-orange-500/20 border border-orange-500'
                                        : 'bg-secondary/20 hover:bg-secondary/40'
                                        }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={chronicConditions[condition.key] || false}
                                        onChange={(e) => setChronicConditions({ ...chronicConditions, [condition.key]: e.target.checked })}
                                        className="hidden"
                                    />
                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${chronicConditions[condition.key] ? 'bg-orange-500 border-orange-500' : 'border-muted-foreground/30'
                                        }`}>
                                        {chronicConditions[condition.key] && <CheckCircle className="w-3 h-3 text-white" />}
                                    </div>
                                    <span className="text-sm">{isRTL ? condition.label : condition.labelEn}</span>
                                </label>
                            ))}
                        </div>
                    </GlassCard>
                </div>
            </div>

            {/* Patient Info Dropdowns */}
            <GlassCard className="mt-6">
                <h3 className="text-lg font-semibold mb-4">
                    {isRTL ? 'معلومات المريض' : 'Patient Information'}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {Object.entries(PATIENT_INFO).map(([key, info]) => (
                        <div key={key}>
                            <label className="block text-sm text-gray-300 mb-1">
                                {isRTL ? info.label : info.labelEn}
                            </label>
                            <select
                                value={patientInfo[key as keyof typeof patientInfo]}
                                onChange={(e) => setPatientInfo({ ...patientInfo, [key]: parseInt(e.target.value) })}
                                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                            >
                                {info.options.map((option) => (
                                    <option key={option.value} value={option.value} className="bg-background">
                                        {isRTL ? option.label : option.labelEn}
                                    </option>
                                ))}
                            </select>
                        </div>
                    ))}
                    <div>
                        <label className="block text-sm text-muted-foreground mb-1">
                            {isRTL ? 'مجموعة الخطر' : 'Risk Group'}
                        </label>
                        <select
                            value={riskGroup}
                            onChange={(e) => setRiskGroup(parseInt(e.target.value))}
                            className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                        >
                            {RISK_GROUPS.map((option) => (
                                <option key={option.value} value={option.value} className="bg-background">
                                    {isRTL ? option.label : option.labelEn}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </GlassCard>

            {/* Actions */}
            <div className="flex flex-col md:flex-row gap-4 mt-8">
                <Button
                    onClick={() => handlePredict('classical')}
                    disabled={predicting || !apiStatus?.models_loaded?.classical}
                    className="flex-1 btn-gradient relative overflow-hidden group"
                >
                    {predicting && selectedModel === 'classical' ? (
                        <LoadingSpinner size="sm" />
                    ) : (
                        <>
                            <Brain className="w-5 h-5 mr-2" />
                            <div className="text-left">
                                <div className="font-bold">{isRTL ? 'تحليل كلاسيكي' : 'Classical Analysis'}</div>
                                <div className="text-[10px] opacity-70">Logistic Regression</div>
                            </div>
                        </>
                    )}
                </Button>

                <Button
                    onClick={() => handlePredict('quantum')}
                    disabled={predicting || !apiStatus?.models_loaded?.quantum}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white border-none relative overflow-hidden group"
                >
                    {predicting && selectedModel === 'quantum' ? (
                        <LoadingSpinner size="sm" />
                    ) : (
                        <>
                            <Activity className="w-5 h-5 mr-2" />
                            <div className="text-left">
                                <div className="font-bold">{isRTL ? 'تحليل كمي (الكونتم)' : 'Quantum Analysis'}</div>
                                <div className="text-[10px] opacity-70">QSVC Quantum Model</div>
                            </div>
                        </>
                    )}
                </Button>

                <Button variant="outline" onClick={handleReset} className="md:w-32 border-white/20 hover:bg-white/10">
                    {isRTL ? 'إعادة تعيين' : 'Reset'}
                </Button>
            </div>

            {/* Error */}
            {error && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 p-4 bg-red-500/20 border border-red-500 rounded-lg flex items-center gap-3"
                >
                    <AlertCircle className="w-6 h-6 text-red-400" />
                    <span>{error}</span>
                </motion.div>
            )}

            {/* Result */}
            {result && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-6"
                >
                    <GlassCard className="border-2 border-primary">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <CheckCircle className="w-6 h-6 text-green-400" />
                            {isRTL ? 'نتيجة التحليل' : 'Analysis Result'}
                        </h3>
                        <div className="text-center py-6">
                            <div className="text-4xl font-bold text-primary mb-2">
                                {translateDisease(result.prediction).ar}
                            </div>
                            <div className="text-xl text-muted-foreground mb-2">
                                {translateDisease(result.prediction).en}
                            </div>
                            <div className="text-sm text-muted-foreground/80">
                                ({result.prediction})
                            </div>
                        </div>
                        {result.probabilities && result.probabilities.length > 0 && (
                            <div className="mt-4 pt-4 border-t border-white/10">
                                <div className="text-sm text-gray-400 mb-2">
                                    {isRTL ? 'نسبة الثقة' : 'Confidence'}
                                </div>
                                <div className="h-4 bg-secondary rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-primary to-cyan-400 rounded-full"
                                        style={{ width: `${Math.max(...result.probabilities) * 100}%` }}
                                    />
                                </div>
                                <div className="text-right mt-1 text-sm">
                                    {(Math.max(...result.probabilities) * 100).toFixed(1)}%
                                </div>
                            </div>
                        )}
                    </GlassCard>
                </motion.div>
            )}
        </DashboardLayout>
    );
}
