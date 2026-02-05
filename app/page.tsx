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
    Bone
} from 'lucide-react';

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

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-8"></div>
                <p className="text-blue-400/60 dark:text-blue-500/40 font-black tracking-[5px] text-[10px] uppercase">Curating Excellence</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950">
            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-6 transition-all duration-300">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black uppercase tracking-[3px] mb-1">{getGreeting()}</p>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Hi, {firstName}.</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <Link href="/profile" className="w-12 h-12 bg-white dark:bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-800 relative rounded-2xl shadow-sm hover:shadow-xl hover:border-blue-600/30 transition-all duration-300 group">
                            <Stethoscope className="text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors" size={24} />
                            {hasUnread && (
                                <span className="absolute top-0 right-0 w-3 h-3 bg-blue-600 border-2 border-white dark:border-slate-950 rounded-full animate-bounce"></span>
                            )}
                        </Link>
                        <button onClick={logout} className="p-3 text-slate-500 hover:text-red-500 transition-colors rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20">
                            <LogOut size={20} />
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-10">
                {/* Performance Dashboard Widget */}
                <section className="mb-14">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-900 dark:bg-slate-900 p-8 sm:p-10 shadow-2xl rounded-[40px] overflow-hidden border border-slate-800/50 relative group"
                    >
                        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:bg-blue-600/20 transition-all duration-500"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/5 rounded-full blur-3xl -ml-20 -mb-20"></div>

                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
                            <div className="max-w-xl">
                                <span className="text-blue-400 dark:text-blue-500 font-black text-[9px] uppercase tracking-[4px] mb-4 block">Academic Program</span>
                                <h2 className="text-white text-4xl sm:text-5xl font-black tracking-tighter leading-tight italic uppercase">
                                    {profile?.program ? formatProgram(profile.program) : 'Curriculum Not Set'}
                                </h2>
                            </div>
                            <ShieldCheck className="text-white/10 hidden md:block group-hover:text-blue-500/20 group-hover:scale-110 transition-all duration-500" size={100} strokeWidth={1} />
                        </div>

                        <div className="relative z-10 flex flex-wrap items-center gap-10 border-t border-white/5 pt-10">
                            <div className="flex items-center gap-4 group/item">
                                <div className="w-12 h-12 bg-white/10 flex items-center justify-center rounded-2xl group-hover/item:bg-blue-600/20 transition-colors">
                                    <Clock className="text-white group-hover/item:text-blue-400" size={24} />
                                </div>
                                <div>
                                    <p className="text-slate-400 font-black text-[8px] uppercase tracking-[2px] mb-1">Status</p>
                                    <p className="text-white font-black text-sm uppercase tracking-tighter">
                                        {daysRemaining !== null ? `${daysRemaining} Days Access` : 'Trial Access'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 group/item">
                                <div className="w-12 h-12 bg-white/10 flex items-center justify-center rounded-2xl group-hover/item:bg-indigo-600/20 transition-colors">
                                    <Layers className="text-white group-hover/item:text-indigo-400" size={24} />
                                </div>
                                <div>
                                    <p className="text-slate-400 font-black text-[8px] uppercase tracking-[2px] mb-1">Density</p>
                                    <p className="text-blue-400 font-black text-sm uppercase tracking-tighter">{stats.totalItems} Resources</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 group/item">
                                <div className="w-12 h-12 bg-white/10 flex items-center justify-center rounded-2xl group-hover/item:bg-purple-600/20 transition-colors">
                                    <Sparkles className="text-white group-hover/item:text-purple-400" size={24} />
                                </div>
                                <div>
                                    <p className="text-slate-400 font-black text-[8px] uppercase tracking-[2px] mb-1">Subjects</p>
                                    <p className="text-blue-400 font-black text-sm uppercase tracking-tighter">{stats.subjectsCount} Modules</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 group/item">
                                <div className="w-12 h-12 bg-white/10 flex items-center justify-center rounded-2xl group-hover/item:bg-emerald-600/20 transition-colors">
                                    <GraduationCap className="text-white group-hover/item:text-emerald-400" size={24} />
                                </div>
                                <div>
                                    <p className="text-slate-400 font-black text-[8px] uppercase tracking-[2px] mb-1">Phase</p>
                                    <p className="text-blue-400 font-black text-sm uppercase tracking-tighter">
                                        {profile?.yearOfStudy ? formatYear(profile.yearOfStudy) : 'Not Specified'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </section>

                {/* Recent Materials Slider */}
                {/* Study Continuity (Recents) */}
                {activities.length > 0 && (
                    <section className="mb-14 overflow-hidden">
                        <div className="flex items-end justify-between mb-8 px-1">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic leading-none">Study <span className="text-blue-600">Continuity .</span></h3>
                                <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black mt-2 uppercase tracking-[3px] leading-none">Pick up where you left off</p>
                            </div>
                            <Link href="/library" className="group flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest hover:text-blue-700 transition-colors">
                                View Vault
                                <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>

                        <div className="flex gap-6 overflow-x-auto pb-8 custom-scrollbar scroll-smooth -mx-6 px-6 no-scrollbar">
                            {activities.map((activity, index) => {
                                const Icon = activity.type === 'pdf' ? FileText : Layers;
                                return (
                                    <motion.div
                                        key={activity.$id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        onClick={() => router.push(`/library/${activity.contentId}`)}
                                        className="min-w-[320px] max-w-[320px] bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:border-blue-600/30 transition-all cursor-pointer group relative overflow-hidden shrink-0"
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full -mr-16 -mt-16 group-hover:bg-blue-600/10 transition-colors duration-500"></div>

                                        <div className="flex items-center gap-4 mb-6 relative z-10">
                                            <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/40 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-lg shadow-blue-500/10 duration-300">
                                                <Icon size={24} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-0.5 truncate">{activity.subject}</p>
                                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">{getTimeAgo(activity.timestamp)}</p>
                                            </div>
                                        </div>

                                        <h4 className="text-slate-900 dark:text-white font-black text-lg uppercase tracking-tight italic leading-tight group-hover:text-blue-600 transition-colors relative z-10 mb-2 truncate">
                                            {activity.title}
                                        </h4>
                                        <div className="flex items-center gap-2 text-slate-400 mt-6 relative z-10">
                                            <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                                <div className="h-full bg-blue-600 w-2/3 rounded-full animate-pulse"></div>
                                            </div>
                                            <span className="text-[9px] font-black uppercase tracking-widest shrink-0">Resume Prep</span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </section>
                )}

                {/* Revision Center */}
                <section className="mb-14">
                    <div className="mb-8">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">Revision Center</h3>
                        <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black mt-1 uppercase tracking-widest leading-none">Master Your Concepts</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <Link href="/flashcards" className="group bg-gradient-to-br from-white to-amber-50/50 dark:from-slate-900 dark:to-amber-900/5 p-8 rounded-[40px] border border-amber-100 dark:border-amber-900/30 shadow-sm hover:shadow-2xl hover:border-amber-600/30 transition-all">
                            <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center rounded-2xl mb-6 shadow-xl shadow-amber-500/10 group-hover:scale-110 group-hover:bg-amber-600 transition-all duration-300">
                                <Layers className="text-amber-600 group-hover:text-white transition-colors" size={28} />
                            </div>
                            <h4 className="text-slate-900 dark:text-white font-black text-xl mb-1 italic uppercase tracking-tighter">Flashcards</h4>
                            <p className="text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-[2px]">Anatomy Revision</p>
                        </Link>

                        <Link href="/notebook" className="group bg-gradient-to-br from-white to-emerald-50/50 dark:from-slate-900 dark:to-emerald-900/5 p-8 rounded-[40px] border border-emerald-100 dark:border-emerald-900/30 shadow-sm hover:shadow-2xl hover:border-emerald-600/30 transition-all">
                            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center rounded-2xl mb-6 shadow-xl shadow-emerald-500/10 group-hover:scale-110 group-hover:bg-emerald-600 transition-all duration-300">
                                <PenTool className="text-emerald-600 group-hover:text-white transition-colors" size={28} />
                            </div>
                            <h4 className="text-slate-900 dark:text-white font-black text-xl mb-1 italic uppercase tracking-tighter">Notebook</h4>
                            <p className="text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase tracking-[2px]">Clinical Observations</p>
                        </Link>

                        <Link href="/library" className="group bg-gradient-to-br from-white to-blue-50/50 dark:from-slate-900 dark:to-blue-900/5 p-8 rounded-[40px] border border-blue-100 dark:border-blue-900/30 shadow-sm hover:shadow-2xl hover:border-blue-600/30 transition-all">
                            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center rounded-2xl mb-6 shadow-xl shadow-blue-500/10 group-hover:scale-110 group-hover:bg-blue-600 transition-all duration-300">
                                <BookOpen className="text-blue-600 group-hover:text-white transition-colors" size={28} />
                            </div>
                            <h4 className="text-slate-900 dark:text-white font-black text-xl mb-1 italic uppercase tracking-tighter">Library</h4>
                            <p className="text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-[2px]">E-books & Manuals</p>
                        </Link>

                        <Link href="/support" className="group bg-gradient-to-br from-white to-slate-100/50 dark:from-slate-900 dark:to-slate-800/10 p-8 rounded-[40px] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:border-slate-400/30 transition-all">
                            <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 flex items-center justify-center rounded-2xl mb-6 shadow-xl shadow-slate-500/10 group-hover:scale-110 group-hover:bg-slate-900 transition-all duration-300">
                                <Stethoscope className="text-slate-600 group-hover:text-white transition-colors" size={28} />
                            </div>
                            <h4 className="text-slate-900 dark:text-white font-black text-xl mb-1 italic uppercase tracking-tighter">Support</h4>
                            <p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-[2px]">Help Center</p>
                        </Link>
                    </div>
                </section>

                {/* Main Curriculum Grid */}
                <section className="mb-14">
                    <div className="flex items-end justify-between mb-10">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase italic">Main Curriculum</h3>
                            <p className="text-slate-400 dark:text-slate-500 text-[10px] font-black mt-1 uppercase tracking-widest leading-none">Architectural Modules</p>
                        </div>
                    </div>

                    {subjects.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                            {subjects.map((subject, index) => {
                                const Icon = getSubjectIcon(subject);
                                return (
                                    <motion.div
                                        key={index}
                                        whileHover={{ y: -8 }}
                                        onClick={() => router.push(`/library?subject=${subject}`)}
                                        className="bg-white dark:bg-slate-900 p-8 rounded-[45px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-3xl hover:border-blue-600/40 transition-all duration-500 cursor-pointer group relative overflow-hidden"
                                    >
                                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-600/5 rounded-full group-hover:bg-blue-600/10 transition-colors duration-500"></div>

                                        <div className="flex justify-between items-start mb-8 relative z-10">
                                            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center rounded-2xl border border-blue-100 dark:border-blue-800 group-hover:bg-blue-600 group-hover:scale-110 transition-all duration-500 shadow-lg shadow-blue-500/5">
                                                <Icon className="text-blue-600 group-hover:text-white transition-colors" size={32} />
                                            </div>
                                            <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center group-hover:bg-blue-600 transition-all duration-500">
                                                <ArrowUpRight className="text-slate-300 group-hover:text-white transition-colors" size={20} />
                                            </div>
                                        </div>

                                        <h4 className="text-slate-900 dark:text-white font-black text-xl uppercase tracking-tighter leading-none mb-6 group-hover:text-blue-600 transition-colors relative z-10">{subject}</h4>

                                        <div className="flex items-center gap-2 relative z-10">
                                            <div className="flex-1 h-2 bg-blue-50 dark:bg-blue-950 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    whileInView={{ width: '40%' }}
                                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600"
                                                ></motion.div>
                                            </div>
                                            <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Ongoing</span>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="col-span-full py-24 text-center bg-white dark:bg-slate-900 rounded-[50px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/10 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                            <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 flex items-center justify-center rounded-[30px] mx-auto mb-8 shadow-xl relative z-10">
                                <Search className="text-slate-300" size={48} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic relative z-10">Architecting Curriculum</h3>
                            <p className="text-slate-400 font-medium text-base mt-4 uppercase tracking-widest max-w-sm mx-auto px-6 relative z-10 leading-loose">Our academic team is curating high-fidelity modules for your profile.</p>
                        </div>
                    )}
                </section>

                {/* Medical Term of the Day */}
                <section>
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="bg-slate-900 p-12 sm:p-20 rounded-[60px] overflow-hidden relative shadow-3xl group"
                    >
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(37,99,235,0.05)_1px,transparent_1px),linear-gradient(-45deg,rgba(37,99,235,0.05)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
                        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px] -mr-40 -mt-40 group-hover:bg-blue-600/20 transition-colors duration-1000"></div>
                        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-indigo-600/5 rounded-full blur-[100px] -ml-40 -mb-40"></div>

                        <div className="relative z-10 max-w-3xl">
                            <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 backdrop-blur-2xl rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] mb-10 text-blue-400 border border-white/10 shadow-2xl">
                                <Sparkles className="animate-pulse" size={16} />
                                Daily Clinical Insight
                            </div>
                            <h2 className="text-white text-5xl sm:text-7xl font-black mb-10 tracking-tighter italic uppercase leading-none group-hover:text-blue-400 transition-colors duration-500">
                                &quot;{dailyTerm.term}&quot;
                            </h2>
                            <p className="text-blue-100/70 font-medium text-xl sm:text-2xl leading-relaxed mb-14 tracking-tight">
                                {dailyTerm.def}
                            </p>
                            <button className="px-12 py-6 bg-blue-600 hover:bg-white hover:text-blue-600 text-white rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-blue-600/40 transition-all duration-500 active:scale-95 group/btn flex items-center gap-4">
                                Explore Terminology
                                <ChevronRight className="group-hover/btn:translate-x-2 transition-transform duration-500" size={20} />
                            </button>
                        </div>

                        <Activity className="absolute bottom-10 right-10 text-white/5 group-hover:text-blue-500/10 group-hover:scale-110 transition-all duration-1000" size={300} strokeWidth={0.5} />
                    </motion.div>
                </section>
            </main>

            {/* Custom Background Elements */}
            <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px]"></div>
            </div>
        </div>
    );
}
