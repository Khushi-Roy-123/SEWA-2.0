import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { MedicalRecord } from '../services/recordService';
import { PlusIcon, FileTextIcon, XIcon, CameraIcon, LanguagesIcon } from '../components/Icons';
import { useData } from '@/contexts/DataContext';
import { ExternalLinkIcon } from 'lucide-react';

const ViewRecordModal: React.FC<{ record: MedicalRecord; onClose: () => void }> = ({ record, onClose }) => {
    const navigate = useNavigate();
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="bg-sky-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">Patient</span>
                            <span className="text-xs font-black text-slate-700 uppercase tracking-tight">{record.patientName}</span>
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">{record.title}</h2>
                        <p className="text-sm text-slate-500">{new Date(record.date).toLocaleDateString()} • {record.doctor}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                        <XIcon />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    <div>
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Record Type</h3>
                        <span className="bg-sky-100 text-sky-800 text-xs font-bold px-3 py-1 rounded-full uppercase">
                            {record.type}
                        </span>
                    </div>

                    {record.criticalPhrases && record.criticalPhrases.length > 0 && (
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Critical Findings</h3>
                            <div className="flex flex-wrap gap-2">
                                {record.criticalPhrases.map((phrase, i) => (
                                    <span key={i} className="bg-red-50 text-red-700 border border-red-100 px-2 py-1 rounded-md text-sm font-medium">
                                        {phrase}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {record.summary && (
                        <div className="bg-sky-50 p-6 rounded-xl border border-sky-100">
                            <h3 className="text-sm font-bold text-sky-900 uppercase tracking-wider mb-2">AI Medical Analysis</h3>
                            <p className="text-sky-800 leading-relaxed text-sm font-medium">{record.summary}</p>
                        </div>
                    )}

                    {record.translatedText && (
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Translated Report</h3>
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
                                {record.translatedText}
                            </div>
                        </div>
                    )}

                    {record.imageUrl && (
                        <div>
                            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Original Document</h3>
                            <div className="rounded-xl overflow-hidden border-2 border-slate-100 shadow-sm relative group">
                                {record.imageUrl.startsWith('data:application/pdf') ? (
                                    <div className="w-full h-[200px] flex flex-col items-center justify-center bg-slate-50 gap-4">
                                        <div className="p-4 bg-red-50 rounded-2xl">
                                            <svg className="w-12 h-12 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <p className="text-sm font-bold text-slate-600">PDF Document</p>
                                    </div>
                                ) : (
                                    <img src={record.imageUrl} alt="Medical record" className="w-full h-auto max-h-[400px] object-contain bg-slate-50" />
                                )}
                                <a
                                    href={record.imageUrl}
                                    download={record.title.replace(/\s+/g, '_') + (record.imageUrl.startsWith('data:application/pdf') ? '.pdf' : '.jpg')}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="absolute bottom-4 right-4 bg-white/90 backdrop-blur-md p-3 rounded-2xl text-sky-600 hover:text-sky-700 transition-all shadow-lg flex items-center gap-2 text-xs font-black uppercase"
                                >
                                    <ExternalLinkIcon size={16} />
                                    {record.imageUrl.startsWith('data:application/pdf') ? 'Download PDF' : 'Full Size'}
                                </a>
                            </div>
                        </div>
                    )}

                    {!record.translatedText && record.extractedText && (
                        <div className="pt-4 border-t border-slate-100">
                            <button
                                onClick={() => navigate('/translated-record', { state: { extractedText: record.extractedText, imageUrl: record.imageUrl } })}
                                className="w-full flex items-center justify-center gap-3 py-4 bg-sky-600 text-white rounded-2xl font-black shadow-xl shadow-sky-100 hover:bg-sky-700 transition-all active:scale-[0.98]"
                            >
                                <LanguagesIcon />
                                <span>TRANSLATE REPORT WITH AI</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const Records: React.FC = () => {
    const navigate = useNavigate();
    const { records, isPreloading } = useData();
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredRecords, setFilteredRecords] = useState<MedicalRecord[]>([]);
    const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);

    useEffect(() => {
        const lowercasedQuery = searchQuery.toLowerCase();
        const newFilteredRecords = records.filter(record =>
            record.type.toLowerCase().includes(lowercasedQuery) ||
            record.title.toLowerCase().includes(lowercasedQuery) ||
            record.doctor.toLowerCase().includes(lowercasedQuery)
        );
        setFilteredRecords(newFilteredRecords);
    }, [searchQuery, records]);

    if (isPreloading && records.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-slate-900">Health Records</h1>
                <button
                    onClick={() => navigate('/upload-record')}
                    className="flex items-center gap-2 bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md hover:bg-sky-700 transition-colors"
                >
                    <PlusIcon />
                    <span>Add New Record</span>
                </button>
            </div>

            <div className="mb-4">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search by type, details, or provider..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md leading-5 bg-white placeholder-slate-500 focus:outline-none focus:placeholder-slate-400 focus:ring-1 focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="border-b border-slate-200 bg-slate-50">
                            <tr>
                                <th className="p-4 font-bold text-sm text-slate-500 uppercase tracking-wider">Date</th>
                                <th className="p-4 font-bold text-sm text-slate-500 uppercase tracking-wider">Type</th>
                                <th className="p-4 font-bold text-sm text-slate-500 uppercase tracking-wider">Details</th>
                                <th className="p-4 font-bold text-sm text-slate-500 uppercase tracking-wider">Provider</th>
                                <th className="p-4 font-bold text-sm text-slate-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredRecords.length > 0 ? (
                                filteredRecords.map(record => (
                                    <tr key={record.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="p-4 text-slate-600 whitespace-nowrap text-sm">{new Date(record.date).toLocaleDateString()}</td>
                                        <td className="p-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                {record.imageUrl?.startsWith('data:application/pdf') ? (
                                                    <span className="text-red-500" title="PDF Document">
                                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                        </svg>
                                                    </span>
                                                ) : record.imageUrl ? (
                                                    <span className="text-sky-500" title="Image Record">
                                                        <CameraIcon />
                                                    </span>
                                                ) : null}
                                                <span className="bg-sky-100 text-sky-700 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wide">{record.type}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 font-semibold text-slate-800 group-hover:text-sky-600 transition-colors">{record.title}</td>
                                        <td className="p-4 text-slate-600 text-sm">{record.doctor}</td>
                                        <td className="p-4 text-right">
                                            <button
                                                onClick={() => setSelectedRecord(record)}
                                                className="text-sky-600 hover:text-sky-800 font-semibold text-sm hover:bg-sky-50 px-3 py-1.5 rounded-lg transition-colors"
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="text-center p-12 text-slate-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <FileTextIcon />
                                            <p className="mt-2">No records found.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {selectedRecord && (
                <ViewRecordModal
                    record={selectedRecord}
                    onClose={() => setSelectedRecord(null)}
                />
            )}
        </div>
    );
};

export default Records;