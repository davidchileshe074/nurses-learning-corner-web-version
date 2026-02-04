'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { noteServices } from '@/services/notes';
import { syncServices } from '@/services/sync';
import { Note } from '@/types';

interface NoteEditorProps {
    userId: string;
    contentId: string;
    initialTitle?: string;
    initialContent?: string;
    onSave?: (note: Note) => void;
}

export function NoteEditor({ userId, contentId, initialTitle = '', initialContent = '', onSave }: NoteEditorProps) {
    const [title, setTitle] = useState(initialTitle);
    const [content, setContent] = useState(initialContent);
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        const loadNote = async () => {
            if (contentId && contentId !== 'general' && !initialTitle && !initialContent) {
                setIsLoading(true);
                try {
                    const note = await noteServices.getNoteByContent(userId, contentId);
                    if (note) {
                        setTitle(note.title);
                        setContent(note.content);
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
        if (!title.trim() && !content.trim()) return;

        setIsSaving(true);
        const payload = {
            userId,
            contentId,
            title: title || 'Untitled Note',
            content: content
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
        if (!isLoading && (title !== initialTitle || content !== initialContent)) {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

            saveTimeoutRef.current = setTimeout(() => {
                handleSave();
            }, 2000); // Auto-save after 2 seconds of inactivity
        }

        return () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        };
    }, [title, content, isLoading]);

    return (
        <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </div>
                    <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-[10px]">Digital Notebook</h3>
                </div>

                <div className="flex items-center gap-3">
                    {isLoading ? (
                        <span className="text-[10px] font-bold text-slate-400 animate-pulse">Loading...</span>
                    ) : isSaving ? (
                        <span className="text-[10px] font-bold text-slate-400 animate-pulse">Saving...</span>
                    ) : lastSaved ? (
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] font-bold text-slate-400">
                                {isOffline ? 'Saved Locally (Offline)' : 'Cloud Synced'}
                            </span>
                            <span className="text-[8px] font-bold text-slate-300">
                                {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    ) : null}
                    <button
                        onClick={handleSave}
                        disabled={isSaving || isLoading}
                        className="px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-wider hover:scale-105 transition-transform disabled:opacity-50"
                    >
                        Save Now
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col p-6 gap-4">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Note Title..."
                    disabled={isLoading}
                    className="text-xl font-bold bg-transparent border-none focus:ring-0 text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-700 disabled:opacity-50"
                />
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Start typing your clinical reflections, study points, or questions..."
                    disabled={isLoading}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-slate-700 dark:text-slate-300 placeholder:text-slate-300 dark:placeholder:text-slate-700 resize-none leading-relaxed disabled:opacity-50"
                />
            </div>

            <div className="px-6 py-4 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                <div className="flex gap-2">
                    {['B', 'I', 'U'].map((tool) => (
                        <button key={tool} className="w-8 h-8 rounded-lg hover:bg-white dark:hover:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-400 transition-colors">{tool}</button>
                    ))}
                </div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Markdown Supported</p>
            </div>
        </div>
    );
}
