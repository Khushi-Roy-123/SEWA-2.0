import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { BusinessApiService, ApiKey, AggregatedHealthData } from '../services/businessApiService';
import {
    Code2, Key, Copy, Check, Trash2, Plus, Database, Shield, BarChart3,
    Users, Heart, Activity, AlertCircle, Loader2, Eye, EyeOff, RefreshCw
} from 'lucide-react';

const BusinessApi: React.FC = () => {
    const { currentUser } = useAuth();
    const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
    const [aggregatedData, setAggregatedData] = useState<AggregatedHealthData | null>(null);
    const [isLoadingData, setIsLoadingData] = useState(false);

    // New key form
    const [showNewKeyForm, setShowNewKeyForm] = useState(false);
    const [businessName, setBusinessName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [isCreatingKey, setIsCreatingKey] = useState(false);
    const [newKeyCreated, setNewKeyCreated] = useState<string | null>(null);
    const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
    const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

    // Subscribe to API keys
    useEffect(() => {
        if (!currentUser) return;
        const unsubscribe = BusinessApiService.subscribeToApiKeys(currentUser.uid, setApiKeys);
        return () => unsubscribe();
    }, [currentUser]);

    // Load aggregated data
    const loadAggregatedData = async () => {
        setIsLoadingData(true);
        try {
            const data = await BusinessApiService.getAggregatedData();
            setAggregatedData(data);
        } catch (err) {
            console.error('Failed to load aggregated data:', err);
        } finally {
            setIsLoadingData(false);
        }
    };

    useEffect(() => {
        loadAggregatedData();
    }, []);

    const handleCreateKey = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !businessName.trim()) return;
        setIsCreatingKey(true);
        try {
            const key = await BusinessApiService.createApiKey(
                currentUser.uid,
                businessName.trim(),
                contactEmail.trim()
            );
            setNewKeyCreated(key);
            setShowNewKeyForm(false);
            setBusinessName('');
            setContactEmail('');
        } catch (err) {
            console.error('Failed to create API key:', err);
        } finally {
            setIsCreatingKey(false);
        }
    };

    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKeyId(id);
        setTimeout(() => setCopiedKeyId(null), 2000);
    };

    const toggleKeyVisibility = (id: string) => {
        setVisibleKeys(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const maskKey = (key: string) => key.substring(0, 8) + '•'.repeat(24) + key.substring(key.length - 4);

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12">
            {/* Hero Header */}
            <div className="relative bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-[2.5rem] p-8 sm:p-12 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(99,102,241,0.15),transparent_60%)]" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(14,165,233,0.1),transparent_50%)]" />
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-indigo-500/20 rounded-xl border border-indigo-400/30">
                            <Code2 className="text-indigo-300" size={24} />
                        </div>
                        <span className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.3em]">Developer Portal</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">SEWA Business API</h1>
                    <p className="text-slate-400 text-sm sm:text-base max-w-lg leading-relaxed">
                        Access anonymized, aggregated health data for research, analytics, and business intelligence.
                        Generate API keys to integrate SEWA data into your applications.
                    </p>
                    <div className="flex flex-wrap gap-3 mt-6">
                        <div className="flex items-center gap-2 bg-white/10 text-white/80 px-3 py-1.5 rounded-lg text-xs font-bold">
                            <Shield size={14} /> Privacy-First
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 text-white/80 px-3 py-1.5 rounded-lg text-xs font-bold">
                            <Database size={14} /> Aggregated Only
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 text-white/80 px-3 py-1.5 rounded-lg text-xs font-bold">
                            <BarChart3 size={14} /> Real-Time Stats
                        </div>
                    </div>
                </div>
            </div>

            {/* New key created banner */}
            {newKeyCreated && (
                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="font-black text-emerald-800 flex items-center gap-2 mb-2">
                                <Check size={18} /> API Key Created Successfully
                            </h3>
                            <p className="text-xs text-emerald-600 mb-3">Copy this key now. You won't be able to see it in full again.</p>
                            <code className="bg-emerald-100 text-emerald-900 px-4 py-2 rounded-lg font-mono text-sm font-bold block break-all">
                                {newKeyCreated}
                            </code>
                        </div>
                        <button
                            onClick={() => { copyToClipboard(newKeyCreated, 'new'); setNewKeyCreated(null); }}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-colors flex items-center gap-2"
                        >
                            <Copy size={14} /> Copy & Dismiss
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: API Keys Management */}
                <div className="lg:col-span-2 space-y-6">
                    {/* API Keys Section */}
                    <div className="bg-white rounded-[2rem] border-2 border-slate-100 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                    <Key size={20} className="text-indigo-500" /> API Keys
                                </h2>
                                <p className="text-xs text-slate-500 mt-1">Manage your API access credentials</p>
                            </div>
                            <button
                                onClick={() => setShowNewKeyForm(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-colors shadow-md active:scale-95"
                            >
                                <Plus size={16} /> Generate Key
                            </button>
                        </div>

                        {/* New Key Form */}
                        {showNewKeyForm && (
                            <div className="p-6 bg-indigo-50 border-b border-indigo-100">
                                <form onSubmit={handleCreateKey} className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1 block">Business Name *</label>
                                            <input
                                                type="text"
                                                value={businessName}
                                                onChange={e => setBusinessName(e.target.value)}
                                                placeholder="Acme Health Analytics"
                                                className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:border-indigo-400 focus:outline-none transition-colors"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1 block">Contact Email</label>
                                            <input
                                                type="email"
                                                value={contactEmail}
                                                onChange={e => setContactEmail(e.target.value)}
                                                placeholder="dev@acme.com"
                                                className="w-full px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-sm font-medium focus:border-indigo-400 focus:outline-none transition-colors"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            type="submit"
                                            disabled={isCreatingKey || !businessName.trim()}
                                            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                                        >
                                            {isCreatingKey ? <Loader2 size={16} className="animate-spin" /> : <Key size={16} />}
                                            {isCreatingKey ? 'Generating...' : 'Generate API Key'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowNewKeyForm(false)}
                                            className="px-4 py-2.5 bg-white text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-50 border-2 border-slate-200"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Key List */}
                        <div className="divide-y divide-slate-50">
                            {apiKeys.length === 0 ? (
                                <div className="p-12 text-center">
                                    <Key className="mx-auto text-slate-300 mb-4" size={40} />
                                    <p className="text-slate-500 font-medium">No API keys yet</p>
                                    <p className="text-slate-400 text-sm">Generate your first key to get started</p>
                                </div>
                            ) : apiKeys.map(key => (
                                <div key={key.id} className="p-5 hover:bg-slate-50 transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-bold text-slate-900">{key.businessName}</h3>
                                            <p className="text-xs text-slate-500">{key.contactEmail || 'No email'}</p>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${key.status === 'active'
                                            ? 'bg-emerald-100 text-emerald-700'
                                            : 'bg-red-100 text-red-700'
                                            }`}>
                                            {key.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-4 py-2.5">
                                        <code className="flex-1 text-xs font-mono text-slate-700 break-all">
                                            {visibleKeys.has(key.id!) ? key.key : maskKey(key.key)}
                                        </code>
                                        <button
                                            onClick={() => toggleKeyVisibility(key.id!)}
                                            className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                                            title={visibleKeys.has(key.id!) ? 'Hide' : 'Show'}
                                        >
                                            {visibleKeys.has(key.id!) ? <EyeOff size={14} /> : <Eye size={14} />}
                                        </button>
                                        <button
                                            onClick={() => copyToClipboard(key.key, key.id!)}
                                            className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                                            title="Copy"
                                        >
                                            {copiedKeyId === key.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                        </button>
                                        {key.status === 'active' && (
                                            <button
                                                onClick={() => BusinessApiService.revokeApiKey(key.id!)}
                                                className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                                                title="Revoke"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex gap-4 mt-2 text-[10px] text-slate-400 font-medium">
                                        <span>Created {new Date(key.createdAt).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span>{key.requestCount} requests</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* API Documentation */}
                    <div className="bg-white rounded-[2rem] border-2 border-slate-100 overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-slate-100">
                            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                <Code2 size={20} className="text-sky-500" /> API Reference
                            </h2>
                            <p className="text-xs text-slate-500 mt-1">Integrate SEWA health data into your applications</p>
                        </div>
                        <div className="p-6 space-y-6">
                            {/* Endpoint 1 */}
                            <div className="bg-slate-50 rounded-2xl p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md">GET</span>
                                    <code className="text-sm font-mono font-bold text-slate-800">/api/v1/health-stats</code>
                                </div>
                                <p className="text-xs text-slate-500 mb-4">Returns aggregated, anonymized health statistics across the platform.</p>
                                <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
                                    <pre className="text-xs text-slate-300 font-mono">
                                        {`curl -X GET "https://api.sewa.health/v1/health-stats" \\
  -H "Authorization: Bearer sewa_YOUR_API_KEY" \\
  -H "Content-Type: application/json"

# Response
{
  "totalPatients": 1247,
  "bloodGroupDistribution": {
    "O+": 412, "A+": 289, "B+": 234, ...
  },
  "ageDemographics": [
    { "range": "0-18", "count": 156 },
    { "range": "19-30", "count": 389 }, ...
  ],
  "avgHealthScore": 72,
  "totalClinicVisits": 5823
}`}
                                    </pre>
                                </div>
                            </div>

                            {/* Endpoint 2 */}
                            <div className="bg-slate-50 rounded-2xl p-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="bg-emerald-500 text-white text-[10px] font-black px-2 py-0.5 rounded-md">GET</span>
                                    <code className="text-sm font-mono font-bold text-slate-800">/api/v1/queue-analytics</code>
                                </div>
                                <p className="text-xs text-slate-500 mb-4">Returns clinic queue analytics including wait times, peak hours, and visit patterns.</p>
                                <div className="bg-slate-900 rounded-xl p-4 overflow-x-auto">
                                    <pre className="text-xs text-slate-300 font-mono">
                                        {`curl -X GET "https://api.sewa.health/v1/queue-analytics" \\
  -H "Authorization: Bearer sewa_YOUR_API_KEY"

# Response
{
  "avgWaitTime": "14min",
  "peakHours": ["10:00", "14:00", "16:00"],
  "dailyVisits": 47,
  "busiestDay": "Monday"
}`}
                                    </pre>
                                </div>
                            </div>

                            {/* Rate Limits */}
                            <div className="bg-amber-50 border-2 border-amber-100 rounded-2xl p-5">
                                <h3 className="font-bold text-amber-800 flex items-center gap-2 mb-2">
                                    <AlertCircle size={16} /> Rate Limits
                                </h3>
                                <div className="grid grid-cols-3 gap-4 text-center mt-3">
                                    <div className="bg-white rounded-xl p-3">
                                        <p className="text-lg font-black text-amber-700">1,000</p>
                                        <p className="text-[10px] font-bold text-amber-500 uppercase">Requests/Day</p>
                                    </div>
                                    <div className="bg-white rounded-xl p-3">
                                        <p className="text-lg font-black text-amber-700">100</p>
                                        <p className="text-[10px] font-bold text-amber-500 uppercase">Requests/Min</p>
                                    </div>
                                    <div className="bg-white rounded-xl p-3">
                                        <p className="text-lg font-black text-amber-700">5</p>
                                        <p className="text-[10px] font-bold text-amber-500 uppercase">Keys/Account</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Live Data Preview */}
                <div className="space-y-6">
                    <div className="bg-white rounded-[2rem] border-2 border-slate-100 overflow-hidden shadow-sm sticky top-4">
                        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-black text-slate-900 flex items-center gap-2 text-sm">
                                <Activity size={16} className="text-sky-500" /> Live Data Preview
                            </h3>
                            <button
                                onClick={loadAggregatedData}
                                disabled={isLoadingData}
                                className="p-2 text-slate-400 hover:text-sky-600 transition-colors"
                            >
                                <RefreshCw size={14} className={isLoadingData ? 'animate-spin' : ''} />
                            </button>
                        </div>

                        {isLoadingData ? (
                            <div className="p-12 text-center">
                                <Loader2 className="mx-auto text-sky-400 animate-spin mb-3" size={32} />
                                <p className="text-xs font-bold text-slate-400">Loading data...</p>
                            </div>
                        ) : aggregatedData ? (
                            <div className="p-5 space-y-4">
                                {/* Stat Cards */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-sky-50 rounded-2xl p-4 text-center">
                                        <Users className="mx-auto text-sky-500 mb-1" size={20} />
                                        <p className="text-2xl font-black text-sky-700">{aggregatedData.totalPatients}</p>
                                        <p className="text-[9px] font-black text-sky-400 uppercase tracking-widest">Total Patients</p>
                                    </div>
                                    <div className="bg-emerald-50 rounded-2xl p-4 text-center">
                                        <Activity className="mx-auto text-emerald-500 mb-1" size={20} />
                                        <p className="text-2xl font-black text-emerald-700">{aggregatedData.totalClinicVisits}</p>
                                        <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Clinic Visits</p>
                                    </div>
                                    <div className="bg-indigo-50 rounded-2xl p-4 text-center col-span-2">
                                        <Heart className="mx-auto text-indigo-500 mb-1" size={20} />
                                        <p className="text-2xl font-black text-indigo-700">{aggregatedData.avgHealthScore}<span className="text-sm">/100</span></p>
                                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Avg Health Score</p>
                                    </div>
                                </div>

                                {/* Blood Group Distribution */}
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Blood Groups</h4>
                                    <div className="space-y-1.5">
                                        {Object.entries(aggregatedData.bloodGroupDistribution).map(([group, count]) => (
                                            <div key={group} className="flex items-center gap-2">
                                                <span className="w-8 text-xs font-black text-rose-600">{group}</span>
                                                <div className="flex-1 bg-slate-100 rounded-full h-4 overflow-hidden">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-full transition-all duration-500"
                                                        style={{ width: `${Math.max(5, (count / aggregatedData.totalPatients) * 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-xs font-bold text-slate-600 w-6 text-right">{count}</span>
                                            </div>
                                        ))}
                                        {Object.keys(aggregatedData.bloodGroupDistribution).length === 0 && (
                                            <p className="text-xs text-slate-400 italic">No blood group data yet</p>
                                        )}
                                    </div>
                                </div>

                                {/* Age Demographics */}
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Age Demographics</h4>
                                    <div className="flex gap-1">
                                        {aggregatedData.ageDemographics.map(demo => (
                                            <div key={demo.range} className="flex-1 text-center">
                                                <div className="bg-slate-100 rounded-lg overflow-hidden h-16 flex items-end justify-center mb-1">
                                                    <div
                                                        className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-md transition-all duration-500"
                                                        style={{ height: `${Math.max(8, (demo.count / Math.max(...aggregatedData.ageDemographics.map(d => d.count), 1)) * 100)}%` }}
                                                    />
                                                </div>
                                                <p className="text-[9px] font-bold text-slate-500">{demo.range}</p>
                                                <p className="text-[10px] font-black text-slate-700">{demo.count}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Gender */}
                                <div>
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Gender</h4>
                                    <div className="flex gap-2">
                                        {Object.entries(aggregatedData.genderDistribution).map(([gender, count]) => (
                                            <div key={gender} className="flex-1 bg-slate-50 rounded-xl p-2.5 text-center">
                                                <p className="text-sm font-black text-slate-700">{count}</p>
                                                <p className="text-[9px] font-bold text-slate-400">{gender}</p>
                                            </div>
                                        ))}
                                        {Object.keys(aggregatedData.genderDistribution).length === 0 && (
                                            <p className="text-xs text-slate-400 italic">No gender data yet</p>
                                        )}
                                    </div>
                                </div>

                                <div className="text-[9px] text-slate-400 text-center pt-2 border-t border-slate-100">
                                    Last updated: {new Date(aggregatedData.dataTimestamp).toLocaleTimeString()}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BusinessApi;
