'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { noteServices } from '@/services/notes';
import { syncServices } from '@/services/sync';
import { Note } from '@/types';
import {
    Save,
    CloudCheck,
    Link as LinkIcon,
    Type,
    Bold,
    Italic,
    Underline,
    CircleCheck,
    CloudIcon,
    AlertCircle,
    BookOpen
} from 'lucide-react';

interface NoteEditorProps {
    userId: string;
    contentId: string;
    initialContent?: string;
    onSave?: (note: Note) => void;
}

export function NoteEditor({ userId, contentId, initialContent = '', onSave }: NoteEditorProps) {
    const [content, setContent] = useState(initialContent);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        const loadNote = async () => {
            if (contentId && contentId !== 'general' && !initialContent) {
                setIsLoading(true);
                try {
                    const note = await noteServices.getNoteByContent(userId, contentId);
                    if (note) {
                        setContent(note.text);
                    }
                } catch (error) {
                    console.error('Failed to load note:', error);
                } finally {
                    setIsLoading(false);
                }
            }
        };
        loadNote();
    }, [userId, contentId]);

    const saveTimeoutRef = useRef<any>(null);

    const handleSave = async () => {
        if (!content.trim()) return;

        setIsSaving(true);
        const payload = {
            userId,
            contentId,
            text: content,
            tags: '' // Placeholder for future tag implementation
        };

        try {
            const savedNote = await noteServices.upsertNote(payload);
            setLastSaved(new Date());
            setIsOffline(false);
            if (onSave) onSave(savedNote as unknown as Note);
        } catch (error) {
            console.warn('Direct save failed, enqueuing for sync:', error);
            await syncServices.enqueue('note_upsert', payload);
            setLastSaved(new Date());
            setIsOffline(true);
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        if (!isLoading && content !== initialContent) {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

            saveTimeoutRef.current = setTimeout(() => {
                handleSave();
            }, 2000); // Auto-save after 2 seconds of inactivity
        }

        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [content, isLoading]);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden relative">
            <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-600/20">
                        <BookOpen size={24} />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] text-[10px]">Clinical Record</h3>
                        <p className="text-[10px] font-bold text-slate-400">Electronic Health Documentation</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden sm:flex flex-col items-end">
                        {isLoading ? (
                            <div className="flex items-center gap-2 text-slate-400">
                                <CloudIcon size={12} className="animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Fetching...</span>
                            </div>
                        ) : isSaving ? (
                            <div className="flex items-center gap-2 text-purple-600">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse"></div>
                                <span className="text-[9px] font-black uppercase tracking-widest">Committing...</span>
                            </div>
                        ) : lastSaved ? (
                            <div className={`flex items-center gap-2 ${isOffline ? 'text-orange-500' : 'text-green-600'}`}>
                                {isOffline ? <AlertCircle size={12} /> : <CircleCheck size={12} />}
                                <div className="text-right leading-none">
                                    <span className="text-[9px] font-black uppercase tracking-widest block">{isOffline ? 'Local Save' : 'Cloud Sync'}</span>
                                    <span className="text-[8px] font-bold opacity-60 uppercase">{lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={isSaving || isLoading}
                        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-purple-600/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
                    >
                        <Save size={14} />
                        Finalize
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col px-10 py-8 gap-6 custom-scrollbar overflow-y-auto">
                <div className="flex items-center gap-3 pb-6 border-b border-slate-50 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500">
                        <Type size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Clinical Log Entrance</span>
                    </div>
                </div>

                <div className="flex items-center gap-3 py-3 border-y border-slate-50 dark:border-slate-800">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-500">
                        <Type size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Standard Typography</span>
                    </div>
                    <div className="h-4 w-px bg-slate-100 dark:bg-slate-800 mx-2"></div>
                    <div className="flex gap-2">
                        {[Bold, Italic, Underline].map((Icon, i) => (
                            <button key={i} className="w-8 h-8 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 transition-colors">
                                <Icon size={14} />
                            </button>
                        ))}
                    </div>
                </div>

                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Commence clinical documentation here... Notes support rich-text interpretation and autonomous cloud synchronization."
                    disabled={isLoading}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-slate-600 dark:text-slate-300 placeholder:text-slate-200 dark:placeholder:text-slate-800 resize-none leading-loose text-lg font-medium disabled:opacity-50 min-h-[300px]"
                />
            </div>

            <div className="px-10 py-6 bg-slate-50/50 dark:bg-slate-800/20 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-4 text-slate-400">
                    <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black uppercase tracking-widest">Status:</span>
                        <span className={`w-2 h-2 rounded-full ${isOffline ? 'bg-orange-500' : 'bg-green-500'}`}></span>
                    </div>
                    {contentId !== 'general' && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-full border border-purple-100 dark:border-purple-900/30">
                            <LinkIcon size={12} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Resource Bound</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">Characters</span>
                    <span className="text-[10px] font-black text-purple-600 bg-purple-50 dark:bg-purple-900/20 px-2 py-1 rounded-lg">
                        {content.length.toLocaleString()}
                    </span>
                </div>
            </div>
        </div>
    );
}
