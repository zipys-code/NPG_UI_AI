import React, { useState, useMemo } from 'react';
import { Power, XCircle, MessageSquare, X, ArrowUpDown, History } from 'lucide-react';
import { apiRequest } from "@/services/api";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

const formatDisplayDate = (dateStr: string) => {
    if (!dateStr || typeof dateStr !== 'string') return '-';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
    } catch (e) { return dateStr; }
};

interface InterfacesGridProps {
    data: any[];
    onRefresh: () => void;
    onSearchHistory: (opId: number) => void;
}

export const InterfacesGrid = ({ data = [], onRefresh, onSearchHistory }: InterfacesGridProps) => {
    const { token, currentNetworkId, currentUser } = useApp();
    const [selectedOp, setSelectedOp] = useState<any>(null);
    const [reason, setReason] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: 'lastUpdateDate', direction: 'desc' });
    const [statusError, setStatusError] = useState<string | null>(null);

    const safeData = useMemo(() => Array.isArray(data) ? data : [], [data]);

    const sortedData = useMemo(() => {
        const sortableItems = [...safeData];
        sortableItems.sort((a, b) => {
            let aVal = a[sortConfig.key];
            let bVal = b[sortConfig.key];
            if (sortConfig.key === 'lastUpdateDate') {
                const timeA = aVal ? new Date(aVal).getTime() : 0;
                const timeB = bVal ? new Date(bVal).getTime() : 0;
                return sortConfig.direction === 'desc' ? timeB - timeA : timeA - timeB;
            }
            if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sortableItems;
    }, [safeData, sortConfig]);

    const requestSort = (sortKey: string) => {
        setSortConfig(prev => ({
            key: sortKey,
            direction: prev.key === sortKey && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    };

    const handleUpdateStatus = async (availableFlag: number) => {
        if (!reason.trim()) {
            toast.error("חובה להזין סיבת שינוי");
            return;
        }
        setStatusError(null);
        try {
            const res = await apiRequest('/SetOperatorInterfaces', {
                setIn: {
                    token, selfNetworkID: currentNetworkId,
                    operatorID: selectedOp.operatorId,
                    interfaceIn: selectedOp.in_interfaceId,
                    interfaceOut: selectedOp.out_interfaceId,
                    description: reason, availableFlag,
                    user: currentUser?.name
                }
            });
            const notifications = res?.setOut?.notification?.msg || [];
            const errorMsg = notifications.find((m: any) => m.code !== '1000');
            if (errorMsg) {
                setStatusError(errorMsg.msgBody);
                return;
            }
            toast.success("המצב עודכן בהצלחה");
            setSelectedOp(null); setReason(""); onRefresh();
        } catch (err: any) { setStatusError("שגיאת תקשורת"); }
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr className="h-9">
                            <SortableHeader label="שם מפעיל" sortKey="operatorName" config={sortConfig} onSort={requestSort} />
                            <th className="px-3 text-[11px] font-bold text-slate-500 text-center">ממשק נכנס</th>
                            <th className="px-3 text-[11px] font-bold text-slate-500 text-center">ממשק יוצא</th>
                            <SortableHeader label="עדכון אחרון" sortKey="lastUpdateDate" config={sortConfig} onSort={requestSort} />
                            <th className="px-3 text-[11px] font-bold text-slate-500 text-center">פעולות</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {sortedData.map((op, idx) => (
                            <tr key={op.operatorId || idx} className="hover:bg-slate-50/50 transition-colors h-10">
                                <td className="px-3 text-xs font-bold text-slate-700">{op.operatorName}</td>
                                <td className="px-3 text-center"><StatusBadge isActive={Number(op.in_state) === 1} /></td>
                                <td className="px-3 text-center"><StatusBadge isActive={Number(op.out_state) === 1} /></td>
                                <td className="px-3 text-[11px] text-slate-500 font-medium">{formatDisplayDate(op.lastUpdateDate)}</td>
                                <td className="px-3">
                                    <div className="flex justify-center gap-1.5">
                                        <button onClick={() => setSelectedOp(op)} className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-[10px] font-bold hover:bg-blue-100 flex items-center gap-1">
                                            שינוי מצב
                                        </button>
                                        <button onClick={() => onSearchHistory(op.operatorId)} className="px-2 py-1 bg-slate-50 text-slate-600 rounded text-[10px] font-bold hover:bg-slate-200 flex items-center gap-1">
                                            היסטוריה
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {selectedOp && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" dir="rtl">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="bg-blue-600 px-4 py-3 flex justify-between items-center text-white">
                            <h3 className="font-bold text-sm">שינוי מצב: {selectedOp.operatorName}</h3>
                            <button onClick={() => setSelectedOp(null)} className="text-white/80 hover:text-white"><X size={18} /></button>
                        </div>
                        {statusError && (
                            <div className="bg-red-50 border-b border-red-100 p-2 text-red-800 text-[10px] font-bold flex items-center gap-2">
                                <XCircle size={14} /> {statusError}
                            </div>
                        )}
                        <div className="p-4 space-y-3">
                            <div className="bg-slate-50 p-2 rounded border border-slate-100 flex justify-between items-center text-[11px] font-bold">
                                <span className="text-slate-600">סטטוס נוכחי:</span>
                                <StatusBadge isActive={Number(selectedOp.in_state) === 1} />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-500 mr-1">סיבת שינוי (חובה):</label>
                                <textarea className="w-full border border-slate-200 rounded p-2 text-xs h-20 outline-none focus:border-blue-500 resize-none" value={reason} onChange={(e) => setReason(e.target.value)} />
                            </div>
                        </div>
                        <div className="p-4 bg-slate-50 border-t flex gap-2">
                            <button onClick={() => handleUpdateStatus(1)} disabled={Number(selectedOp.in_state) === 1} className={`flex-1 py-1.5 rounded font-bold text-xs ${Number(selectedOp.in_state) === 1 ? 'bg-slate-200 text-slate-400' : 'bg-green-600 text-white'}`}>פעיל</button>
                            <button onClick={() => handleUpdateStatus(0)} disabled={Number(selectedOp.in_state) === 0} className={`flex-1 py-1.5 rounded font-bold text-xs ${Number(selectedOp.in_state) === 0 ? 'bg-slate-200 text-slate-400' : 'bg-red-600 text-white'}`}>לא פעיל</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const SortableHeader = ({ label, sortKey, config, onSort }: any) => (
    <th className="px-3 text-[11px] font-bold text-slate-500 cursor-pointer hover:text-blue-600 transition-colors" onClick={() => onSort(sortKey)}>
        <div className="flex items-center gap-1 justify-start">
            <ArrowUpDown size={10} className={config.key === sortKey ? 'text-blue-600' : 'text-slate-300'} />
            {label}
        </div>
    </th>
);

const StatusBadge = ({ isActive }: { isActive: boolean }) => (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${isActive ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
        <div className={`w-1 h-1 rounded-full ${isActive ? 'bg-green-500' : 'bg-red-500'}`} />
        {isActive ? 'ACTIVE' : 'DOWN'}
    </span>
);