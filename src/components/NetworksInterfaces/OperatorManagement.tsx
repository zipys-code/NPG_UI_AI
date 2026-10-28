import React, { useState } from 'react';
import { Layout, Network, Activity } from 'lucide-react';
import InterfacesManager from './InterfacesManager'; // הקומפוננטה שבנינו הרגע
import { NetworksManager } from './NetworksManager';

export default function OperatorManagement() {
    const [activeTab, setActiveTab] = useState<'interfaces' | 'networks'>('interfaces');

    return (
        <div className="min-h-screen bg-slate-50 p-6 rtl" dir="rtl">

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