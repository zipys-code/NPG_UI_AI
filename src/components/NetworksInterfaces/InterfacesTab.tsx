import React, { useState } from 'react';
import { Power, Globe, Clock, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

export const InterfacesTab = ({ data, onStatusChange }: { data: any[], onStatusChange: (op: any) => void }) => {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-right border-collapse">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="p-4 text-xs font-bold text-slate-500">שם מפעיל</th>
                        <th className="p-4 text-xs font-bold text-slate-500">סטטוס (In/Out)</th>
                        <th className="p-4 text-xs font-bold text-slate-500">כתובת ממשק (URL)</th>
                        <th className="p-4 text-xs font-bold text-slate-500">עדכון אחרון</th>
                        <th className="p-4 text-xs font-bold text-slate-500">פעולות</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {data.map((op) => (
                        <tr key={op.operatorId} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-4 font-semibold text-slate-700">{op.operatorName}</td>
                            <td className="p-4">
                                <div className="flex gap-2">
                                    {/* Inbound Status */}
                                    <StatusChip label="IN" isActive={op.in_state === '1'} />
                                    {/* Outbound Status */}
                                    <StatusChip label="OUT" isActive={op.out_state === '1'} />
                                </div>
                            </td>
                            <td className="p-4">
                                <div className="flex items-center gap-2 text-blue-600 text-xs">
                                    <Globe size={14} />
                                    <span className="truncate max-w-[200px]" title={op.url}>{op.url}</span>
                                </div>
                            </td>
                            <td className="p-4 text-xs text-slate-500">
                                <div className="flex items-center gap-1">
                                    <Clock size={14} />
                                    {op.lastUpdate}
                                </div>
                            </td>
                            <td className="p-4">
                                <button
                                    onClick={() => onStatusChange(op)}
                                    className="p-2 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold"
                                >
                                    <Power size={16} />
                                    שינוי מצב
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// קומפוננטת עזר לצ'יפ סטטוס
const StatusChip = ({ label, isActive }: { label: string, isActive: boolean }) => (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold border ${isActive
            ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
        {isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
        {label}
    </div>
);