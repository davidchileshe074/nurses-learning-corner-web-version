"use client"
import { useState, useEffect, useCallback, useMemo } from 'react';
import { contentServices } from '@/services/content';
import { subscriptionServices } from '@/services/subscription';
import { Content, Program } from '@/types';
import { ContentCard } from '@/components/ContentCard';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/hooks/useAuthStore';
import { storage, config } from '@/lib/appwrite';
import { db } from '@/lib/db';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Search,
    Filter,
    BookOpen,
    ChevronRight,
    Layers,
    X,
    LayoutGrid,
    Globe,
    Download,
    FileText,
    Mic,
    CheckCircle,
    ArrowUpRight,
    SearchX,
    Sparkles,
    GraduationCap,
    Clock,
    Zap
} from 'lucide-react';

const PROGRAMS: Program[] = ['RN', 'RM', 'PHN', 'EN', 'EM'];
const COURSES = [
    'Anatomy & Physiology',
    'Fundamentals of Nursing',
    'Pharmacology',
    'Medical-Surgical Nursing',
    'Pediatric Nursing',
    'Midwifery & Obstetrics',
    'Community Health Nursing',
    'Mental Health Nursing',
    'Microbiology',
    'Psychology & Sociology',
    'Nutrition & Dietetics',
    'Nursing Research',
    'Leadership & Management',
    'First Aid & Emergency',
    'Nursing Care Plan'
];

const FILTER_OPTIONS = ['All', 'Downloads', 'PDF', 'Audio', 'Past Paper', 'Marking Key', 'Others'];

export default function LibraryPage() {
    const { profile, user } = useAuthStore();
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialSubject = searchParams.get('subject');

    // -- State --
    const [allContent, setAllContent] = useState<Content[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSubject, setActiveSubject] = useState<string | null>(initialSubject || null);
    const [activeFilter, setActiveFilter] = useState('All');
    const [showAll, setShowAll] = useState(false);
    const [offset, setOffset] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [totalResults, setTotalResults] = useState(0);
    const LIMIT = 12;

    // -- Authentication & Subscription Guard --
    useEffect(() => {
        const checkSub = async () => {
            if (user) {
                const sub = await subscriptionServices.getSubscriptionStatus(user.$id);
                setIsSubscribed(subscriptionServices.checkSubscriptionExpiry(sub));
            }
        };
        checkSub();
    }, [user]);

    // -- Data Fetching --
    const fetchLibraryData = useCallback(async (isInitial = true) => {
        if (!user) return;
        setIsLoading(true);

        try {
            const currentOffset = isInitial ? 0 : offset;
            let fetchedDocuments: Content[] = [];
            let total = 0;

            if (activeFilter === 'Downloads') {
                // LOCAL INDEXEDDB FETCH
                const downloads = await db.cachedContent.toArray();
                fetchedDocuments = (downloads as any[]).filter(d => {
                    if (activeSubject && d.subject !== activeSubject) return false;
                    return true;
                });
                total = fetchedDocuments.length;
                setHasMore(false);
            } else {
                // REMOTE APPWRITE FETCH
                const programToFetch = showAll ? 'ALL' : profile?.program;
                const result = await contentServices.getLibraryContent(
                    programToFetch,
                    activeSubject || undefined,
                    activeFilter,
                    currentOffset,
                    LIMIT
                );
                fetchedDocuments = result.documents;
                total = result.total;
                setHasMore(currentOffset + fetchedDocuments.length < total);
            }

            if (isInitial) {
                setAllContent(fetchedDocuments);
                setOffset(fetchedDocuments.length);
            } else {
                setAllContent(prev => [...prev, ...fetchedDocuments]);
                setOffset(prev => prev + fetchedDocuments.length);
            }
            setTotalResults(total);
        } catch (error) {
            console.error('Library Fetch Error:', error);
        } finally {
            setIsLoading(false);
        }
    }, [user, profile?.program, activeSubject, activeFilter, showAll, offset]);

    useEffect(() => {
        fetchLibraryData(true);
    }, [activeSubject, activeFilter, showAll]);

    // -- Client-side Search Filtering --
    const displayedContent = useMemo(() => {
        if (!searchQuery) return allContent;
        const query = searchQuery.toLowerCase();
        return allContent.filter(item =>
            item.title.toLowerCase().includes(query) ||
            item.subject.toLowerCase().includes(query)
        );
    }, [allContent, searchQuery]);

    // -- Search Suggestions --
    const suggestions = useMemo(() => {
        if (!searchQuery || searchQuery.length < 2) return [];
        const query = searchQuery.toLowerCase();

        const matchingCourses = COURSES.filter(c => c.toLowerCase().includes(query))
            .map(c => ({ type: 'subject' as const, label: c, id: `subj-${c}` }));

        const matchingTitles = allContent
            .filter(item => item.title.toLowerCase().includes(query))
            .slice(0, 5)
            .map(item => ({ type: 'content' as const, label: item.title, id: `cont-${item.$id}`, item }));

        return [...matchingCourses, ...matchingTitles];
    }, [searchQuery, allContent]);

    // -- Handlers --
    const handleOpenContent = (item: Content) => {
        if (!isSubscribed) {
            alert('This premium clinical resource requires an active subscription.');
            router.push('/profile');
            return;
        }
        router.push(`/library/${item.$id}`);
    };

    const handleDownload = async (item: Content) => {
        if (!isSubscribed) {
            alert('Subscription required for offline availability.');
            return;
        }

        const fileId = item.fileId || (item as any).storageFileId;
        if (!fileId) return;

        try {
            const fileUrl = storage.getFileDownload(config.bucketId, fileId);
            const response = await fetch(fileUrl.toString());
            const fileBlob = await response.blob();

            await db.cachedContent.put({
                ...item,
                blob: fileBlob,
                downloadedAt: new Date().toISOString()
            } as any);

            alert('Resource encrypted and stored for offline access.');
        } catch (error) {
            console.error('Download error:', error);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 px-6 py-10 relative overflow-hidden">
            {/* Background elements */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px]"></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Dashboard Header */}
                <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-16">
                    <div>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center gap-2 mb-4"
                        >
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></div>
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em]">Integrated Curriculum Repository</span>
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic leading-none"
                        >
                            Clinical Library <span className="text-blue-600 italic">.</span>
                        </motion.h1>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto">
                        {/* Search Input with Suggestions */}
                        <div className="relative w-full sm:w-[400px] group">
                            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600 transition-colors">
                                <Search size={20} strokeWidth={2.5} />
                            </div>
                            <input
                                type="text"
                                placeholder="Search by topic, unit, or curriculum code..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-16 pr-6 py-5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 focus:border-blue-600 rounded-[30px] outline-none transition-all font-bold text-slate-900 dark:text-white shadow-xl shadow-slate-100/50 dark:shadow-black/50"
                            />

                            {/* Suggestions Dropdown */}
                            <AnimatePresence>
                                {searchQuery.length > 1 && suggestions.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                        className="absolute top-[calc(100%+12px)] left-0 right-0 bg-white dark:bg-slate-900 rounded-[35px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.15)] border border-slate-100 dark:border-slate-800 z-[100] overflow-hidden"
                                    >
                                        <div className="p-4 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex justify-between items-center px-8">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Intelligence</span>
                                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{suggestions.length} Results</span>
                                        </div>
                                        <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                                            {suggestions.map((s) => (
                                                <button
                                                    key={s.id}
                                                    onClick={() => {
                                                        if (s.type === 'subject') setActiveSubject(s.label);
                                                        else handleOpenContent(s.item);
                                                        setSearchQuery('');
                                                    }}
                                                    className="w-full px-8 py-5 flex items-center gap-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left group"
                                                >
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all ${s.type === 'subject' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 group-hover:scale-110'}`}>
                                                        {s.type === 'subject' ? <BookOpen size={20} /> : <FileText size={20} />}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1">{s.label}</p>
                                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                                            {s.type === 'subject' ? 'Course Mapping' : 'Clinical Asset'}
                                                        </p>
                                                    </div>
                                                    <ArrowUpRight size={16} className="ml-auto text-slate-200 group-hover:text-blue-600 transition-colors" />
                                                </button>
                                            ))}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </header>

                {/* Intelligent Navigation Tabs */}
                <div className="space-y-10 mb-16">
                    {/* Program Toggle & Global discovery */}
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-2 rounded-[25px] border border-slate-100 dark:border-slate-800 shadow-xl overflow-x-auto scrollbar-hide max-w-full">
                            <button
                                onClick={() => setActiveSubject(null)}
                                className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${!activeSubject ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-blue-600'}`}
                            >
                                All Disciplines
                            </button>
                            <div className="w-px h-6 bg-slate-100 dark:bg-slate-800 mx-2"></div>
                            {COURSES.map((course) => (
                                <button
                                    key={course}
                                    onClick={() => setActiveSubject(course)}
                                    className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeSubject === course ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-blue-600'}`}
                                >
                                    {course}
                                </button>
                            ))}
                        </div>

                        {isSubscribed && (
                            <motion.button
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setShowAll(!showAll)}
                                className={`flex items-center gap-4 px-6 py-3 rounded-2xl transition-all border-2 ${showAll ? 'bg-blue-600/10 border-blue-600 text-blue-600' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-blue-600'}`}
                            >
                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${showAll ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800'}`}>
                                    <Globe size={16} />
                                </div>
                                <div className="text-left">
                                    <p className="text-[10px] font-black uppercase tracking-widest leading-none">Global Discovery</p>
                                    <p className="text-[8px] font-bold opacity-70 mt-1 uppercase">{showAll ? 'Bypassing Curriculum' : 'Native Syllabus'}</p>
                                </div>
                            </motion.button>
                        )}
                    </div>

                    {/* Secondary Filters: Type & Offline */}
                    <div className="flex flex-wrap items-center gap-4">
                        {FILTER_OPTIONS.map((opt) => (
                            <button
                                key={opt}
                                onClick={() => setActiveFilter(opt)}
                                className={`px-8 py-3.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all border-2 ${activeFilter === opt ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-2xl' : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-400 hover:border-blue-600 hover:text-blue-600'}`}
                            >
                                <div className="flex items-center gap-2">
                                    {opt === 'Downloads' && <Download size={14} />}
                                    {opt === 'PDF' && <FileText size={14} />}
                                    {opt === 'Audio' && <Mic size={14} />}
                                    {opt === 'All' && <LayoutGrid size={14} />}
                                    {opt}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Resource Grid */}
                <main className="min-h-[600px] relative">
                    <div className="flex items-center justify-between mb-10 px-2">
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">Current Repository Allocation</span>
                            <div className="h-px w-20 bg-slate-100 dark:bg-slate-800"></div>
                            <span className="text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/40 px-3 py-1 rounded-lg">
                                {totalResults} Assets Identified
                            </span>
                        </div>
                    </div>

                    {isLoading && offset === 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                <div key={i} className="animate-pulse bg-white dark:bg-slate-900 rounded-[40px] h-[450px] border border-slate-100 dark:border-slate-800"></div>
                            ))}
                        </div>
                    ) : displayedContent.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                                <AnimatePresence mode="popLayout">
                                    {displayedContent.map((item) => (
                                        <ContentCard
                                            key={item.$id}
                                            content={item}
                                            onPress={() => handleOpenContent(item)}
                                            onDownload={() => handleDownload(item)}
                                        />
                                    ))}
                                </AnimatePresence>
                            </div>

                            {hasMore && (
                                <div className="mt-20 flex justify-center">
                                    <button
                                        onClick={() => fetchLibraryData(false)}
                                        disabled={isLoading}
                                        className="group relative px-12 py-5 bg-white dark:bg-slate-900 rounded-[30px] border border-slate-100 dark:border-slate-800 shadow-2xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                                    >
                                        <div className="absolute inset-0 bg-blue-600/5 rounded-[30px] blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <div className="flex items-center gap-3 relative z-10">
                                            {isLoading ? <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div> : <Zap size={18} className="text-blue-600" />}
                                            <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-[0.3em]">
                                                {isLoading ? 'Synchronizing...' : 'Load Sequential Assets'}
                                            </span>
                                        </div>
                                    </button>
                                </div>
                            )}
                        </>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center py-32 text-center"
                        >
                            <div className="w-32 h-32 bg-white dark:bg-slate-900 rounded-[50px] border border-slate-100 dark:border-slate-800 shadow-3xl flex items-center justify-center mb-10 relative">
                                <div className="absolute inset-0 bg-blue-600/5 blur-2xl rounded-full"></div>
                                <SearchX size={48} className="text-slate-200 dark:text-slate-800 relative z-10" />
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter italic">Void Detected</h3>
                            <p className="text-slate-400 font-medium text-lg mt-4 max-w-sm mx-auto leading-relaxed"> No clinical assets match your current filtering protocol.</p>
                            <button
                                onClick={() => { setActiveSubject(null); setActiveFilter('All'); setSearchQuery(''); setShowAll(false); }}
                                className="mt-12 group flex items-center gap-3 text-blue-600 font-black uppercase text-[10px] tracking-widest hover:gap-5 transition-all"
                            >
                                <Zap size={14} />
                                Purge Filters and Reset
                                <ChevronRight size={14} />
                            </button>
                        </motion.div>
                    )}
                </main>
            </div>
        </div>
    );
}
