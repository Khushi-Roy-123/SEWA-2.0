import React, { useState, useEffect, useMemo } from 'react';
import { useTranslations } from '@/lib/i18n';
import { BookOpenIcon, PencilIcon, TrashIcon, XIcon } from '../components/Icons';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const moods = [
    { name: 'Happy', emoji: '😊' }, { name: 'Good', emoji: '🙂' },
    { name: 'Neutral', emoji: '😐' }, { name: 'Worried', emoji: '😕' },
    { name: 'Sad', emoji: '😞' },
];

interface MoodEntry {
    mood: string;
    date: string; // YYYY-MM-DD
}

interface JournalEntry {
    id: string;
    date: string; // ISO string
    content: string;
}

// Session-based in-memory storage (cleared on refresh)
let sessionJournalEntries: JournalEntry[] = [];
let sessionMoodHistory: MoodEntry[] = [];

const MoodTracker: React.FC<{ onMoodSelect: (mood: string) => void }> = ({ onMoodSelect }) => {
    const { t } = useTranslations();
    const [lastMood, setLastMood] = useState<string | null>(null);
    const [moodSubmitted, setMoodSubmitted] = useState(false);

    const handleMoodSelect = (mood: string) => {
        setLastMood(mood);
        setMoodSubmitted(true);
        onMoodSelect(mood);
        setTimeout(() => setMoodSubmitted(false), 3000);
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-slate-800">{t('moodTrackerTitle')}</h2>
            <div className="flex justify-around items-center mt-4 py-4">
                {moods.map(mood => (
                    <button
                        key={mood.name} onClick={() => handleMoodSelect(mood.name)}
                        className={`text-5xl p-2 rounded-full transition-transform duration-200 hover:scale-125 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 ${lastMood === mood.name ? 'transform scale-125' : ''}`}
                        aria-label={mood.name}
                    > {mood.emoji} </button>
                ))}
            </div>
            {moodSubmitted && <p className="text-center text-sm text-green-600 mt-2">{t('moodRecorded')}</p>}
        </div>
    );
};

const MoodHistoryChart: React.FC<{ moodHistory: MoodEntry[] }> = ({ moodHistory }) => {
    const { t } = useTranslations();
    const moodScores: { [key: string]: number } = { Happy: 5, Good: 4, Neutral: 3, Worried: 2, Sad: 1 };

    const data = useMemo(() => {
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - i);
            return d.toISOString().split('T')[0];
        }).reverse();

        return last7Days.map(date => {
            const entry = moodHistory.find(h => h.date === date);
            return {
                name: new Date(date).toLocaleDateString('en-us', { weekday: 'short' }),
                score: entry ? moodScores[entry.mood] : 0,
            };
        });
    }, [moodHistory]);

    if (!BarChart) return null;

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 h-64">
            <h3 className="font-semibold text-slate-700 mb-4">{t('yourMoodThisWeek')}</h3>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 0, right: 10, left: -20, bottom: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis domain={[0, 5]} hide={true} />
                    <Tooltip cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }} contentStyle={{ borderRadius: '0.5rem' }} />
                    <Bar dataKey="score" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};



const Journal: React.FC = () => {
    const { t } = useTranslations();
    const [entries, setEntries] = useState<JournalEntry[]>([]);
    const [newEntry, setNewEntry] = useState('');
    const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
    const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());

    useEffect(() => {
        setEntries([...sessionJournalEntries]);
    }, []);

    const saveEntries = (updatedEntries: JournalEntry[]) => {
        setEntries(updatedEntries);
        sessionJournalEntries = [...updatedEntries];
    };

    const handleSaveEntry = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newEntry.trim()) return;
        const entry: JournalEntry = { id: new Date().toISOString(), date: new Date().toISOString(), content: newEntry.trim() };
        saveEntries([entry, ...entries]);
        setNewEntry('');
    };

    const handleDelete = (id: string) => {
        if (window.confirm(t('deleteConfirmation'))) {
            saveEntries(entries.filter(e => e.id !== id));
        }
    };

    const handleEditSave = (content: string) => {
        if (!editingEntry) return;
        saveEntries(entries.map(e => e.id === editingEntry.id ? { ...e, content } : e));
        setEditingEntry(null);
    };

    const toggleExpand = (id: string) => {
        const newSet = new Set(expandedEntries);
        newSet.has(id) ? newSet.delete(id) : newSet.add(id);
        setExpandedEntries(newSet);
    };

    const EntryContent: React.FC<{ content: string; id: string }> = ({ content, id }) => {
        const isLong = content.length > 150;
        const isExpanded = expandedEntries.has(id);
        const displayContent = isLong && !isExpanded ? `${content.substring(0, 150)}...` : content;

        return (
            <p className="text-slate-600 text-sm whitespace-pre-wrap">
                {displayContent}
                {isLong && (
                    <button onClick={() => toggleExpand(id)} className="text-sky-600 font-semibold ml-2">
                        {isExpanded ? t('readLess') : t('readMore')}
                    </button>
                )}
            </p>
        );
    };

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col h-full">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><BookOpenIcon /> {t('myJournal')}</h2>
            <form onSubmit={handleSaveEntry} className="mt-4">
                <textarea
                    value={newEntry}
                    onChange={(e) => setNewEntry(e.target.value)}
                    rows={4}
                    placeholder={t('journalPlaceholder')}
                    className="w-full p-2 border border-slate-300 rounded-md text-sm focus:ring-sky-500 focus:border-sky-500"
                />
                <button type="submit" className="mt-2 w-full bg-sky-600 text-white font-semibold py-2 rounded-lg text-sm hover:bg-sky-700 transition-colors">{t('saveEntry')}</button>
            </form>
            <div className="mt-6 flex-grow overflow-y-auto space-y-4">
                {entries.map(entry => (
                    <div key={entry.id} className="bg-slate-50 p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-xs font-semibold text-slate-500">{new Date(entry.date).toLocaleString()}</p>
                            <div>
                                <button onClick={() => setEditingEntry(entry)} className="text-slate-500 hover:text-sky-600 mr-2"><PencilIcon /></button>
                                <button onClick={() => handleDelete(entry.id)} className="text-slate-500 hover:text-red-600"><TrashIcon /></button>
                            </div>
                        </div>
                        <EntryContent content={entry.content} id={entry.id} />
                    </div>
                ))}
            </div>
            {editingEntry && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center p-4">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold">{t('editEntry')}</h3>
                                <button onClick={() => setEditingEntry(null)}><XIcon /></button>
                            </div>
                            <textarea
                                defaultValue={editingEntry.content}
                                rows={8}
                                onBlur={(e) => handleEditSave(e.target.value)}
                                className="w-full p-2 border border-slate-300 rounded-md text-sm"
                                autoFocus
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const MentalHealth: React.FC = () => {
    const { t } = useTranslations();
    const [moodHistory, setMoodHistory] = useState<MoodEntry[]>([]);

    useEffect(() => {
        setMoodHistory([...sessionMoodHistory]);
    }, []);

    const handleMoodSelect = (mood: string) => {
        const today = new Date().toISOString().split('T')[0];
        const newEntry: MoodEntry = { mood, date: today };
        const updatedHistory = moodHistory.filter(h => h.date !== today);
        const newHistory = [...updatedHistory, newEntry];
        setMoodHistory(newHistory);
        sessionMoodHistory = [...newHistory];
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto">
            <div>
                <h1 className="text-3xl font-bold text-slate-900">{t('mentalHealthTitle')}</h1>
                <p className="mt-1 text-slate-500">{t('mentalHealthSubtitle')}</p>
            </div>

            <div className="space-y-8">
                <MoodTracker onMoodSelect={handleMoodSelect} />
                <MoodHistoryChart moodHistory={moodHistory} />
                <Journal />
            </div>
        </div>
    );
};

export default MentalHealth;