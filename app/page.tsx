"use client"
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuthStore } from '@/hooks/useAuthStore';
import { activityServices, RecentActivity } from '@/services/activity';
import { contentServices } from '@/services/content';
import { subscriptionServices } from '@/services/subscription';
import { notificationServices } from '@/services/notifications';
import { formatProgram, formatYear } from '@/lib/formatters';
import { Subscription } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
    BookOpen,
    Clock,
    Layers,
    FileText,
    ChevronRight,
    LogOut,
    Sparkles,
    Stethoscope,
    GraduationCap,
    PenTool,
    ShieldCheck,
    Briefcase,
    Pill,
    HeartPulse,
    Microscope,
    Brain,
    Hospital,
    Calculator,
    Activity,
    Search,
    ArrowUpRight,
    Bone,
    WifiOff,
    Cloud
} from 'lucide-react';
import { useOffline } from '@/hooks/useOffline';

const MEDICAL_TERMS = [
    { term: 'Tachycardia', def: 'A heart rate that exceeds the normal resting rate, usually over 100 beats per minute.' },
    { term: 'Bradycardia', def: 'A slower than normal heart rate, typically fewer than 60 beats per minute at rest.' },
    { term: 'Dyspnea', def: 'Difficult or labored breathing; often described as intense tightening in the chest.' },
    { term: 'Ischemia', def: 'An inadequate blood supply to an organ or part of the body, especially the heart muscles.' },
    { term: 'Cyanosis', def: 'A bluish discoloration of the skin resulting from poor circulation or inadequate oxygenation.' },
    { term: 'Edema', def: 'Swelling caused by excess fluid trapped in your body\'s tissues, often in legs or hands.' },
    { term: 'Syncope', def: 'A temporary loss of consciousness caused by a fall in blood pressure; fainting.' },
    { term: 'Pruritus', def: 'Severe itching of the skin, which can be a symptom of various medical conditions.' },
    { term: 'Aphasia', def: 'A language disorder that affects a person\'s ability to communicate and understand speech.' },
    { term: 'Hypoxia', def: 'A condition in which the body or a region of the body is deprived of adequate oxygen supply.' },
    { term: 'Hemostasis', def: 'The stopping of a flow of blood; the first stage of wound healing.' },
    { term: 'Anuria', def: 'The failure of the kidneys to produce urine, often a sign of acute kidney injury.' },
    { term: 'Polyuria', def: 'The production of abnormally large volumes of dilute urine, common in diabetes.' },
    { term: 'Atrophy', def: 'The partial or complete wasting away of a part of the body or tissue.' },
    { term: 'Hyperkalemia', def: 'A high level of potassium in the blood, which can lead to life-threatening heart rhythm issues.' },
    { term: 'Hypokalemia', def: 'A low level of potassium in the blood, often causing muscle weakness and cardiac arrhythmias.' },
    { term: 'Orthopnea', def: 'Shortness of breath that occurs when lying flat, common in heart failure patients.' },
    { term: 'Paresthesia', def: 'An abnormal sensation, typically tingling or pricking ("pins and needles"), caused by pressure on or damage to peripheral nerves.' },
    { term: 'Hematemesis', def: 'The vomiting of blood, which may be bright red or have a "coffee grounds" appearance.' },
    { term: 'Hemoptysis', def: 'The coughing up of blood or blood-stained mucus from the bronchi, larynx, trachea, or lungs.' },
    { term: 'Diaphoresis', def: 'Excessive, abnormal sweating in relation to your surroundings and activity level.' },
    { term: 'Ecchymosis', def: 'A discoloration of the skin resulting from bleeding underneath, typically caused by bruising.' },
    { term: 'Epistaxis', def: 'Bleeding from the nose, which can be caused by trauma, dry air, or certain medications.' },
    { term: 'Nocturia', def: 'A condition in which you wake up during the night because you have to urinate.' },
    { term: 'Oliguria', def: 'The production of abnormally small amounts of urine (typically less than 400mL/day in adults).' },
    { term: 'Stridor', def: 'A high-pitched, wheezing sound caused by disrupted airflow, usually indicating an airway obstruction.' },
    { term: 'Urticaria', def: 'A skin rash with pale red, raised, itchy bumps, commonly known as hives.' },
    { term: 'Dysphagia', def: 'Difficulty swallowing, which can be caused by neurological damage or physical obstruction.' },
    { term: 'Malaise', def: 'A general feeling of discomfort, illness, or uneasiness whose exact cause is difficult to identify.' },
    { term: 'Neuropathy', def: 'Disease or dysfunction of one or more peripheral nerves, typically causing numbness or weakness.' },
    { term: 'Prophylaxis', def: 'Action taken to prevent disease, especially by specified means or against a specified disease.' },
    { term: 'Sepsis', def: 'A life-threatening complication of an infection that can lead to tissue damage and organ failure.' },
    { term: 'Thrombosis', def: 'The formation of a blood clot inside a blood vessel, obstructing the flow of blood through the circulatory system.' },
    { term: 'Auscultation', def: 'The action of listening to sounds from the heart, lungs, or other organs, typically with a stethoscope.' },
    { term: 'Palpation', def: 'A method of feeling with the fingers or hands during a physical examination.' },
    { term: 'Percussion', def: 'A diagnostic procedure designed to determine the density of a body part by the sound produced by tapping it.' },
    { term: 'Ascites', def: 'The accumulation of fluid in the peritoneal cavity, causing abdominal swelling.' },
    { term: 'Borborygmi', def: 'A rumbling or gurgling noise made by the movement of fluid and gas in the intestines.' },
    { term: 'Crepitus', def: 'A grating sound or sensation produced by friction between bone and cartilage or the fractured parts of a bone.' },
    { term: 'Petechiae', def: 'Small red or purple spots on the skin, caused by a minor bleed from broken capillary blood vessels.' },
    { term: 'Photophobia', def: 'Abnormal intolerance to light, often a symptom of migraine or meningitis.' },
    { term: 'Tinnitus', def: 'Ringing or buzzing in the ears that is not caused by an external sound.' },
    { term: 'Vertigo', def: 'A sensation of whirling and loss of balance, associated with looking down from a great height, or caused by disease of the inner ear or the nerve.' },
    { term: 'Xerostomia', def: 'Dryness in the mouth, which may be associated with a change in the composition of saliva, or reduced salivary flow.' },
    { term: 'Anaphylaxis', def: 'A severe, potentially life-threatening allergic reaction that occur rapidly after exposure.' },
    { term: 'Bradyapnea', def: 'Abnormally slow breathing rate, usually fewer than 12 breaths per minute in an adult.' },
    { term: 'Tachypnea', def: 'Abnormally rapid breathing, usually greater than 20 breaths per minute in an adult.' },
    { term: 'Alopecia', def: 'The partial or complete absence of hair from areas of the body where it normally grows.' },
    { term: 'Analgesia', def: 'The inability to feel pain while still conscious; commonly refers to pain relief medication.' },
    { term: 'Antipyretic', def: 'Substances or procedures that reduce fever (e.g., acetaminophen, ibuprofen).' },
    { term: 'Apnea', def: 'The temporary cessation of breathing, especially during sleep.' },
    { term: 'Benign', def: 'Not harmful in effect; in oncology, it refers to a tumor that is not cancerous.' },
    { term: 'Malignant', def: 'Used to describe a cancerous tumor that can grow rapidly and spread to other parts of the body.' },
    { term: 'Biopsy', def: 'An examination of tissue removed from a living body to discover the presence, cause, or extent of a disease.' },
    { term: 'Catheterization', def: 'The introduction of a catheter usually into the bladder, for withdrawing urine.' },
    { term: 'Comorbidity', def: 'The simultaneous presence of two or more diseases or medical conditions in a patient.' },
    { term: 'Contraindication', def: 'A condition or factor that serves as a reason to withhold a certain medical treatment due to the harm that it would cause the patient.' },
    { term: 'Debridement', def: 'The removal of damaged tissue or foreign objects from a wound.' },
    { term: 'Dialysis', def: 'The clinical purification of blood by a machine, as a substitute for the normal function of the kidney.' },
    { term: 'Diplopia', def: 'Technical term for double vision.' },
    { term: 'Diuretic', def: 'A substance that promotes increased production of urine.' },
    { term: 'Dysuria', def: 'Painful or difficult urination.' },
    { term: 'Embolism', def: 'Obstruction of an artery, typically by a clot of blood or an air bubble.' },
    { term: 'Emesis', def: 'The action or process of vomiting.' },
    { term: 'Endoscopy', def: 'A nonsurgical procedure used to examine a person\'s digestive tract.' },
    { term: 'Erythema', def: 'Superficial reddening of the skin, usually in patches, as a result of injury or irritation causing dilatation of the blood capillaries.' },
    { term: 'Exacerbation', def: 'The worsening of a disease or an increase in its symptoms.' },
    { term: 'Febrile', def: 'Having or showing the symptoms of a fever.' },
    { term: 'Fistula', def: 'An abnormal or surgically made passage between a hollow or tubular organ and the body surface, or between two hollow organs.' },
    { term: 'Gastritis', def: 'Inflammation of the lining of the stomach.' },
    { term: 'Gingivitis', def: 'Inflammation of the gums.' },
    { term: 'Hemorrhage', def: 'An escape of blood from a ruptured blood vessel, especially when profuse.' },
    { term: 'Hepatitis', def: 'Inflammation of the liver.' },
    { term: 'Hypoglycemia', def: 'Deficiency of glucose in the bloodstream.' },
    { term: 'Hyperglycemia', def: 'An excess of glucose in the bloodstream, often associated with diabetes mellitus.' },
    { term: 'Idiopathic', def: 'Relating to or denoting any disease or condition that arises spontaneously or for which the cause is unknown.' },
    { term: 'Incontinence', def: 'Lack of voluntary control over urination or defecation.' },
    { term: 'Intubation', def: 'The insertion of a tube into a patient\'s body, especially that of an artificial ventilation tube into the trachea.' },
    { term: 'Jaundice', def: 'A medical condition with yellowing of the skin or whites of the eyes, arising from excess of the pigment bilirubin.' },
    { term: 'Lethargy', def: 'A lack of energy and enthusiasm; a pathological state of sleepiness or deep unresponsiveness.' },
    { term: 'Mastectomy', def: 'A surgical operation to remove a breast.' },
    { term: 'Melena', def: 'Dark sticky feces containing partly digested blood.' },
    { term: 'Metastasis', def: 'The development of secondary malignant growths at a distance from a primary site of cancer.' },
    { term: 'Necrosis', def: 'The death of most or all of the cells in an organ or tissue due to disease, injury, or failure of the blood supply.' },
    { term: 'Nephritis', def: 'Inflammation of the kidneys.' },
    { term: 'Nosocomial', def: 'Originating in a hospital; typically refers to infections acquired during a hospital stay.' },
    { term: 'Palliation', def: 'Relief of symptoms and suffering caused by cancer and other life-threatening diseases.' },
    { term: 'Peritonitis', def: 'Inflammation of the peritoneum, typically caused by bacterial infection either via the blood or after rupture of an abdominal organ.' },
    { term: 'Placebo', def: 'A harmless pill, medicine, or procedure prescribed more for the psychological benefit to the patient than for any physiological effect.' },
    { term: 'Pneumothorax', def: 'The presence of air or gas in the cavity between the lungs and the chest wall, causing collapse of the lung.' },
    { term: 'Polydipsia', def: 'Abnormally great thirst as a symptom of disease (such as diabetes) or psychological disturbance.' },
    { term: 'Prognosis', def: 'The likely course of a disease or ailment.' },
    { term: 'Remission', def: 'A diminution of the seriousness or intensity of disease or pain; a temporary recovery.' },
    { term: 'Rhinorrhea', def: 'A condition where the nasal cavity is filled with a significant amount of mucus fluid (runny nose).' },
    { term: 'Stenosis', def: 'The abnormal narrowing of a passage in the body.' },
    { term: 'Suture', def: 'A stitch or row of stitches holding together the edges of a wound or surgical incision.' },
    { term: 'Synovitis', def: 'Inflammation of a synovial membrane.' },
    { term: 'Systemic', def: 'Relating to a system, especially as opposed to a particular part.' },
    { term: 'Triage', def: 'The assignment of degrees of urgency to wounds or illnesses to decide the order of treatment in a large number of patients or casualties.' }
];

// Speed-optimized Skeleton Components
const Skeleton = ({ className }: { className: string }) => (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-800 rounded-2xl ${className}`} />
);

const DashboardSkeleton = () => (
    <div className="bg-white dark:bg-slate-900/50 p-10 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden h-[400px]">
        <div className="flex flex-col md:flex-row justify-between gap-8 mb-12">
            <div className="space-y-4">
                <Skeleton className="w-32 h-3" />
                <Skeleton className="w-64 h-12" />
            </div>
            <Skeleton className="w-24 h-24 rounded-full hidden md:block opacity-20" />
        </div>
        <div className="flex flex-wrap gap-10 pt-10 border-t border-slate-100 dark:border-slate-800">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-4">
                    <Skeleton className="w-12 h-12 rounded-2xl" />
                    <div className="space-y-2">
                        <Skeleton className="w-16 h-2" />
                        <Skeleton className="w-24 h-4" />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

const CardSkeleton = () => (
    <div className="bg-white dark:bg-slate-900/50 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm shrink-0 min-w-[320px]">
        <div className="flex items-center gap-4 mb-6">
            <Skeleton className="w-12 h-12 rounded-2xl" />
            <div className="space-y-2">
                <Skeleton className="w-20 h-2" />
                <Skeleton className="w-24 h-2" />
            </div>
        </div>
        <Skeleton className="w-full h-6 mb-4" />
        <Skeleton className="w-2/3 h-4" />
    </div>
);

const getSubjectIcon = (subject: string): any => {
    const s = subject.toLowerCase();
    if (s.includes('anatomy')) return Bone;
    if (s.includes('nurs')) return Briefcase;
    if (s.includes('care plan')) return Activity;
    if (s.includes('pharmacology')) return Pill;
    if (s.includes('physio')) return HeartPulse;
    if (s.includes('bio')) return Microscope;
    if (s.includes('psych')) return Brain;
    if (s.includes('medic')) return Hospital;
    if (s.includes('math')) return Calculator;
    return BookOpen;
};

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
};

const getTimeAgo = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffInMs = now.getTime() - then.getTime();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInDays > 0) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    if (diffInHours > 0) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    if (diffInMins > 0) return `${diffInMins} min${diffInMins > 1 ? 's' : ''}s ago`;
    return 'Just now';
};

export default function Home() {
    const { profile, user, logout } = useAuthStore();
    const router = useRouter();
    const [activities, setActivities] = useState<RecentActivity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [subjects, setSubjects] = useState<string[]>([]);
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [stats, setStats] = useState({ totalItems: 0, subjectsCount: 0 });
    const [hasUnread, setHasUnread] = useState(false);
    const isOffline = useOffline();

    const fetchData = useCallback(async () => {
        if (!user) return;
        setIsLoading(true);

        try {
            const [recent, contentRes, subStatus, notifications] = await Promise.all([
                activityServices.getRecentActivity(user.$id),
                contentServices.getLibraryContent(profile?.program || (user as any).program),
                subscriptionServices.getSubscriptionStatus(user.$id),
                notificationServices.getNotifications(user.$id)
            ]);

            setActivities(recent);

            // Extract unique subjects
            const contentItems = contentRes?.documents || [];
            const uniqueSubjects = Array.from(new Set(contentItems.map(item => item.subject))).filter(Boolean) as string[];
            setSubjects(uniqueSubjects);

            setSubscription(subStatus);
            setStats({
                totalItems: contentRes?.total || 0,
                subjectsCount: uniqueSubjects.length
            });

            setHasUnread(notifications.some(n => !n.isRead));

            // INTEGRATION: Mobile Logic Port
            // 1. Digital Nursing Alerts
            await notificationServices.checkAndGenerateNotifications(user.$id, profile, subStatus);

            // 2. Clinical Data Security Purge
            const isSubscribed = subscriptionServices.checkSubscriptionExpiry(subStatus);
            if (!isSubscribed) {
                console.log('[Security] Clinical license expired. Purging local repository.');
                const { downloadServices } = await import('@/services/download');
                await downloadServices.purgeAllDownloads();
            }

        } catch (error) {
            console.error('Home page data fetch error:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user, profile]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const daysRemaining = useMemo(() => {
        if (!subscription?.endDate) return null;
        const expiryDate = new Date(subscription.endDate);
        const now = new Date();
        const diffTime = expiryDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    }, [subscription]);

    const dailyTerm = useMemo(() => {
        const today = new Date();
        const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        return MEDICAL_TERMS[seed % MEDICAL_TERMS.length];
    }, []);

    const firstName = profile?.name?.split(' ')[0] || user?.name?.split(' ')[0] || 'Nurse';

    if (!user) return null;

    return (
        <div className="flex flex-col min-h-screen bg-[#F3F5F7] font-sans selection:bg-[#2B669A]/20">
            {/* Ultra-Clean Sticky Header */}
            <header className="sticky top-0 z-50 bg-[#2B669A] text-white shadow-md transition-all duration-300">
                <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-4"
                    >
                        {/* Logo can be simplified or white version */}
                        <div className="w-8 h-8 bg-white/10 rounded flex items-center justify-center p-1">
                            {/* Assuming logo might need grayscale or white filter, but existing is fine if visible */}
                            <Image src="/logo.svg" alt="NLC Logo" width={32} height={32} className="w-full h-full object-contain brightness-0 invert" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight leading-none text-white">NURSE CORNER</h1>
                        </div>
                    </motion.div>

                    <div className="flex items-center gap-4">
                        {/* Status Indicators - Simplified */}
                        <div className={`px-2 py-1 rounded text-[11px] font-bold uppercase tracking-wider flex items-center gap-2 ${isOffline
                            ? 'bg-amber-500 text-white'
                            : 'bg-emerald-500/20 text-emerald-100'
                            }`}>
                            {isOffline ? <WifiOff size={10} /> : <Cloud size={10} />}
                            <span className="hidden md:block">
                                {isOffline ? 'Offline' : 'Online'}
                            </span>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="hidden sm:block text-right mr-2">
                                <p className="text-white/70 text-[10px] uppercase font-medium">{getGreeting()}</p>
                                <p className="text-sm font-bold text-white tracking-tight">{firstName}</p>
                            </div>
                            <Link href="/profile" className="w-9 h-9 bg-white/10 flex items-center justify-center rounded hover:bg-white/20 transition-all">
                                <GraduationCap className="text-white" size={18} />
                                {hasUnread && (
                                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                                )}
                            </Link>
                            <button onClick={logout} className="w-9 h-9 flex items-center justify-center text-white/80 hover:text-red-200 bg-white/5 rounded hover:bg-red-900/20 transition-all">
                                <LogOut size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
                {/* Dashboard Section */}
                <section className="mb-12">
                    {isLoading ? (
                        <DashboardSkeleton />
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="grid grid-cols-1 md:grid-cols-4 gap-4"
                        >
                            {/* Welcome Card */}
                            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm md:col-span-4 lg:col-span-2">
                                <h2 className="text-xl font-bold text-slate-800 mb-2">Welcome back, {firstName}</h2>
                                <p className="text-sm text-slate-600 mb-4">Your clinical dashboard is ready.</p>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold uppercase">
                                        {profile?.program ? formatProgram(profile.program) : 'Guest'}
                                    </span>
                                </div>
                            </div>

                            {/* Stat Cards */}
                            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-center">
                                <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Retention</p>
                                <p className="text-[#2B669A] text-2xl font-bold">
                                    {daysRemaining !== null ? `${daysRemaining}d` : 'TRIAL'}
                                </p>
                            </div>
                            <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-center">
                                <p className="text-slate-500 text-xs uppercase font-bold tracking-wider mb-1">Library</p>
                                <p className="text-slate-800 text-2xl font-bold">{stats.totalItems}</p>
                            </div>
                        </motion.div>
                    )}
                </section>

                {/* Study Continuity */}
                <section className="mb-14">
                    <div className="flex items-end justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 tracking-tight uppercase">Continuity</h3>
                            <p className="text-slate-500 dark:text-slate-500 text-[11px] font-black mt-2 uppercase tracking-[4px]">Recent Activity Repository</p>
                        </div>
                        <Link href="/recent" className="group flex items-center gap-2 text-[#2B669A] font-bold text-xs uppercase tracking-wide hover:underline transition-all">
                            View All
                            <ArrowUpRight size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </Link>
                    </div>

                    <div className="flex gap-6 overflow-x-auto pb-6 scroll-smooth -mx-6 px-6">
                        {isLoading ? (
                            [1, 2, 3].map(i => <CardSkeleton key={i} />)
                        ) : activities.length > 0 ? (
                            activities.map((activity, index) => {
                                const Icon = activity.type === 'pdf' ? FileText : Layers;
                                return (
                                    <motion.div
                                        key={activity.$id}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: index * 0.05 }}
                                        className="min-w-[280px] bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-[#2B669A]/30 transition-all cursor-pointer group relative overflow-hidden"
                                    >
                                        {/* Gradient accent */}
                                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#2B669A] to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                        <div className="flex items-start gap-3 mb-4">
                                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-[#2B669A] group-hover:text-white transition-all shrink-0">
                                                <Icon size={18} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[10px] font-bold text-[#2B669A] uppercase tracking-wide mb-1">
                                                    {activity.subject}
                                                </p>
                                                <h4 className="text-slate-800 font-bold text-sm line-clamp-2 leading-tight group-hover:text-[#2B669A] transition-colors">
                                                    {activity.title}
                                                </h4>
                                            </div>
                                        </div>

                                        {/* Time and action */}
                                        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                                            <div className="flex items-center gap-2 text-slate-400">
                                                <Clock size={12} />
                                                <span className="text-xs font-medium">{getTimeAgo(activity.timestamp)}</span>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/library/${activity.contentId}`);
                                                }}
                                                className="flex items-center gap-1 text-[#2B669A] text-xs font-bold uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                Resume
                                                <ChevronRight size={14} />
                                            </button>
                                        </div>
                                    </motion.div>
                                );
                            })
                        ) : (
                            <div className="w-full py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[40px] bg-white/30">
                                <p className="text-slate-500 font-black text-[11px] uppercase tracking-widest">No recent repository found</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Revision Center */}
                <section className="mb-14">
                    <div className="mb-8">
                        <h3 className="text-lg font-bold text-slate-800 tracking-tight uppercase">Quick Actions</h3>
                        <p className="text-slate-500 text-[10px] font-medium mt-1 uppercase tracking-wide">Essential Tools</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { title: 'Flashcards', sub: 'Logic Training', icon: Layers, href: '/flashcards', color: 'amber' },
                            { title: 'Notebook', sub: 'Clinical Observations', icon: PenTool, href: '/notebook', color: 'emerald' },
                            { title: 'Library', sub: 'Archival Data', icon: BookOpen, href: '/library', color: 'blue' },
                            { title: 'Support', sub: 'Systems Help', icon: Stethoscope, href: '/support', color: 'slate' }
                        ].map((item, i) => (
                            <Link key={i} href={item.href} className={`group bg-white p-5 rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-[#2B669A]/30 transition-all`}>
                                <div className="flex items-center gap-4 mb-3">
                                    <div className="w-10 h-10 bg-slate-50 flex items-center justify-center rounded-lg group-hover:bg-[#2B669A] group-hover:text-white transition-all">
                                        <item.icon className="text-slate-400 group-hover:text-white" size={20} />
                                    </div>
                                    <h4 className="text-slate-800 font-bold text-lg">{item.title}</h4>
                                </div>
                                <p className="text-[#2B669A] text-[10px] font-bold uppercase tracking-wide pl-1">{item.sub}</p>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* Curriculum Modules */}
                <section className="mb-12">
                    <div className="flex items-end justify-between mb-10">
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 tracking-tight uppercase">Curriculum Modules</h3>
                            <p className="text-slate-500 text-[10px] font-medium mt-1 uppercase tracking-wide">Specialized Content</p>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {[1, 2, 3, 4].map(i => <CardSkeleton key={i} />)}
                        </div>
                    ) : subjects.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {subjects.map((subject, index) => {
                                const Icon = getSubjectIcon(subject);
                                return (
                                    <motion.div
                                        key={index}
                                        whileHover={{ y: -2 }}
                                        onClick={() => router.push(`/library?subject=${subject}`)}
                                        className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-10 h-10 bg-blue-50 flex items-center justify-center rounded-lg border border-blue-100 group-hover:bg-[#2B669A] group-hover:text-white transition-all">
                                                <Icon className="text-[#2B669A] group-hover:text-white" size={20} />
                                            </div>
                                            <ArrowUpRight className="text-slate-300 group-hover:text-[#2B669A] transition-colors" size={18} />
                                        </div>
                                        <h4 className="text-slate-800 font-bold text-sm uppercase tracking-tight mb-2 group-hover:text-[#2B669A] transition-colors">{subject}</h4>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="py-24 text-center bg-white dark:bg-slate-900 rounded-[48px] border border-slate-100 dark:border-slate-800 shadow-sm group">
                            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 flex items-center justify-center rounded-3xl mx-auto mb-8 transition-transform group-hover:scale-110">
                                <Search className="text-slate-300" size={32} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">No Modules Found</h3>
                            <p className="text-slate-400 font-medium text-sm mt-2 uppercase tracking-[3px] max-w-xs mx-auto">Update your profile program to view curriculum</p>
                        </div>
                    )}
                </section>

                {/* Term of the Day - Premium Design */}
                <section>
                    <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-8">
                        <div className="flex-1">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4 text-[#2B669A]">
                                <Sparkles size={12} />
                                Term of the Day
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 mb-4 tracking-tight">
                                &quot;{dailyTerm.term}&quot;
                            </h2>
                            <p className="text-slate-600 text-lg leading-relaxed mb-6 font-medium">
                                {dailyTerm.def}
                            </p>

                        </div>
                    </div>
                </section>
            </main>

            {/* Clean Background */}
            <div className="fixed inset-0 pointer-events-none z-[-1] bg-[#F3F5F7]"></div>
        </div>
    );
}
