import React, { useState } from 'react';
import { Layout, Network, Activity } from 'lucide-react';
import InterfacesManager from './InterfacesManager'; // הקומפוננטה שבנינו הרגע
import { NetworksManager } from './NetworksManager';

export default function OperatorManagement() {
    const [activeTab, setActiveTab] = useState<'interfaces' | 'networks'>('interfaces');

    return (
        <div className="min-h-screen bg-slate-50 p-6 rtl" dir="rtl">
            {/* כותרת דף */}
            {/* <div className="mb-8 flex items-center gap-3">
                <div className="p-3 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-200">
                    <Layout size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 text-right">ניהול מפעילים ורשתות</h1>
                    <p className="text-slate-500 text-sm text-right">הגדרת ממשקים, ניטור סטטוסים וניהול רשתות מפעיל</p>
                </div>
            </div> */}

            {/* ניווט טאבים */}
            {/* <div className="flex gap-2 mb-6 bg-slate-200/50 p-1.5 rounded-2xl w-fit">
                <button
                    onClick={() => setActiveTab('interfaces')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'interfaces'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-600 hover:bg-white/50'
                        }`}
                >
                    <Activity size={18} />
                    ניהול ממשקים (Interfaces)
                </button>
                <button
                    onClick={() => setActiveTab('networks')}
                    className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'networks'
                        ? 'bg-white text-blue-700 shadow-sm'
                        : 'text-slate-600 hover:bg-white/50'
                        }`}
                >
                    <Network size={18} />
                    נתוני רשתות (Networks)
                </button>
            </div> */}

            {/* מעטפת הטאבים המוקטנת */}
            <div className="flex gap-1 mb-2 bg-slate-100/50 p-1 rounded-xl w-fit border border-slate-200/60">
                <button
                    onClick={() => setActiveTab('interfaces')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all ${activeTab === 'interfaces'
                        ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Activity size={14} />
                    ניהול ממשקים (Interfaces)
                </button>
                <button
                    onClick={() => setActiveTab('networks')}
                    className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all ${activeTab === 'networks'
                        ? 'bg-white text-blue-600 shadow-sm border border-slate-200'
                        : 'text-slate-500 hover:text-slate-700'
                        }`}
                >
                    <Network size={14} />
                    נתוני רשתות (Networks)
                </button>
            </div>

            {/* הצגת התוכן לפי הטאב הנבחר */}
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                {activeTab === 'interfaces' ? (
                    <InterfacesManager />
                ) : (
                    <NetworksManager />
                )}
            </div>
        </div>
    );
}