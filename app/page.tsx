"use client"
import { useState, useEffect } from 'react';
import { useAuthStore } from '@/hooks/useAuthStore';
import { activityServices, RecentActivity } from '@/services/activity';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Home() {
  const { profile, user, logout } = useAuthStore();
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      activityServices.getRecentActivity(user.$id)
        .then(setActivities)
        .finally(() => setIsLoading(false));
    }
  }, [user]);

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

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/70 dark:bg-slate-950/70 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white hidden sm:block">Nurse Corner</h1>
          </Link>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end mr-2">
              <p className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1">{profile?.name || user?.name || 'Medic'}</p>
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">{profile?.program || 'RN Candidate'}</p>
            </div>
            <button
              onClick={logout}
              className="p-2 border-2 border-slate-100 dark:border-slate-800 text-slate-500 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
              title="Sign out"
            >
              <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-8">
        {/* Welcome Section */}
        <section className="mb-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl shadow-blue-600/20"
          >
            <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
            <div className="absolute left-1/2 bottom-0 w-48 h-48 bg-blue-400/20 rounded-full blur-3xl"></div>

            <div className="relative z-10">
              <span className="inline-block px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-widest mb-4">Daily Inspiration</span>
              <h2 className="text-3xl font-black mb-2 italic">&quot;The character of the nurse is as important as the knowledge she possesses.&quot;</h2>
              <p className="text-blue-100 font-medium">— Carolyn Jarvis</p>
            </div>
          </motion.div>
        </section>

        {/* Quick Actions/Stats */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Books Read', value: '12', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
            { label: 'Study Hours', value: '48.5', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
            { label: 'Flashcards', value: '342', icon: 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
            { label: 'Notes Taken', value: '89', icon: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' }
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm"
            >
              <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center mb-3">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                </svg>
              </div>
              <p className="text-2xl font-black text-slate-900 dark:text-white leading-none">{stat.value}</p>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-tight mt-1">{stat.label}</p>
            </motion.div>
          ))}
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">Current Focus</h3>
              <Link href="/library" title="library" className="text-sm font-bold text-blue-600 hover:text-blue-500">View All</Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isLoading ? (
                [1, 2].map(i => (
                  <div key={i} className="animate-pulse bg-white dark:bg-slate-900 rounded-2xl h-48 border border-slate-100 dark:border-slate-800"></div>
                ))
              ) : activities.length > 0 ? (
                activities.map((activity) => (
                  <motion.div
                    key={activity.$id}
                    whileHover={{ y: -5 }}
                    className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-4 shadow-sm hover:shadow-xl hover:shadow-blue-600/5 transition-all cursor-pointer"
                  >
                    <div className="aspect-[16/10] bg-slate-100 dark:bg-slate-800 rounded-xl mb-4 overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 dark:bg-slate-900/90 rounded-lg text-[10px] font-black uppercase tracking-widest text-blue-600">
                        {activity.type === 'pdf' ? 'PDF Study' : activity.type === 'flashcard' ? 'Flashcards' : 'Notebook'}
                      </div>
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 transition-colors truncate">{activity.title}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{activity.subject}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400">{getTimeAgo(activity.timestamp)}</span>
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>
                        <span className="text-[10px] font-bold text-blue-600 uppercase">Resume</span>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-12 text-center bg-slate-50/50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-slate-500 dark:text-slate-400 font-medium">No recent activity yet. Start studying!</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="space-y-6">
            <h3 className="text-xl font-black text-slate-900 dark:text-white">Resources</h3>
            <div className="space-y-3">
              {[
                { label: 'Library', color: 'bg-blue-600', sub: 'E-books & Manuals', href: '/library' },
                { label: 'Flashcards', color: 'bg-indigo-600', sub: 'Anatomy Revision', href: '/flashcards' },
                { label: 'Digital Note', color: 'bg-purple-600', sub: 'Clinical Observations', href: '/notebook' },
                { label: 'Support', color: 'bg-slate-600', sub: 'Help Center', href: '/support' }
              ].map((link, i) => (
                <Link
                  key={i}
                  href={link.href}
                  className="w-full flex items-center gap-4 p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all group text-left"
                >
                  <div className={`w-12 h-12 ${link.color} rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/10 shrink-0`}>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors tracking-tight">{link.label}</p>
                    <p className="text-[11px] text-slate-500 font-medium">{link.sub}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Nav Placeholder */}
      <nav className="sm:hidden sticky bottom-0 left-0 right-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 p-4 flex justify-around items-center">
        {[
          { href: '/', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
          { href: '/library', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
          { href: '/notebook', icon: 'M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2' },
          { href: '/profile', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' }
        ].map((item, i) => (
          <Link
            key={i}
            href={item.href}
            className={`p-2 rounded-xl transition-colors ${i === 0 ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
            </svg>
          </Link>
        ))}
      </nav>
    </div>
  );
}
