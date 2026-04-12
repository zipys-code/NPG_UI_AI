import React, { useState, useEffect } from 'react';
import { X, RefreshCw, FastForward, Square, Globe, XCircle, Info, AlertTriangle } from 'lucide-react';
import { useApp } from '@/context/AppContext';

// --- Interfaces ---
interface ActionItem {
    stateTypeId: string;
    stateDesc: string;
    transitionType: string;
}

interface ProcessItem {
    process_id: number | string;
    request_id: string;
    state_desc: string;
    phase?: string;
}

interface ProcessActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: {
        processList?: { item: ProcessItem[] | ProcessItem };
        actions?: { item: ActionItem[] | ActionItem };
        allowCancel?: number | string;
        isPortIn?: number | string;
        notifications?: { item: any[] | any };
        validationNotifications?: { item: any[] | any };
    } | null;
    onActionExecute: (actionId: string, groupId?: string, additionalData?: any) => void;
}

export const ProcessActionModal: React.FC<ProcessActionModalProps> = ({
    isOpen, onClose, data, onActionExecute
}) => {
    const { lovs } = useApp();
    const [groupId, setGroupId] = useState('');
    const [selectedOperators, setSelectedOperators] = useState<string[]>([]);

    // States ל-Port-In
    const [portingDate, setPortingDate] = useState('');
    const [portingTime, setPortingTime] = useState('00:00');
    const [executeDate, setExecuteDate] = useState('');
    const [executeTime, setExecuteTime] = useState('00:00');

    // חילוץ מפעילים מה-LOV
    const getOptionsFromLOV = (categoryKey: string) => {
        const group = lovs?.[categoryKey];
        const items = group?.item || group;
        if (!items || !Array.isArray(items)) return [];
        return items
            .map(opt => ({
                value: opt.value,
                display: opt.label || opt.display || opt.value
            }))
            .filter(opt => opt.value && opt.display !== "-ללא-" && opt.display !== "ללא");
    };

    const networks = getOptionsFromLOV('byBusiness');

    useEffect(() => {
        if (isOpen && data) {
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            setPortingDate(dateStr);
            setExecuteDate(dateStr);
            setSelectedOperators([]);
            setGroupId('');
        }
    }, [isOpen, data]);

    if (!isOpen || !data) return null;

    // חילוץ בטוח של רשימות (מערך או אובייקט בודד)
    const extractItems = (source: any) => {
        if (!source?.item) return [];
        return Array.isArray(source.item) ? source.item : [source.item];
    };

    const processes = extractItems(data.processList);
    const actions = extractItems(data.actions);

    // חילוץ הודעות שגיאה (msgCode שאינו 1000)
    const errorItems = [
        ...extractItems(data.notifications),
        ...extractItems(data.validationNotifications)
    ].filter(m => m.msgCode && String(m.msgCode) !== "1000");

    // לוגיקת תצוגה לפי שלבים
    const isPublishPhase = processes.some(p => p.phase === 'Publish');
    const isExecPhase = processes.some(p => p.phase === 'Exec');

    // עדכון תאריכים מותר רק אם זה Port-In ועדיין לא ב-Publish או Exec
    const canUpdateDates = Number(data.isPortIn) === 1 && !isPublishPhase && !isExecPhase;

    const toggleOperator = (id: string) => {
        setSelectedOperators(prev =>
            prev.includes(id) ? prev.filter(op => op !== id) : [...prev, id]
        );
    };

    const getActionConfig = (type: string) => {
        switch (type?.toUpperCase()) {
            case 'RETRY': return { icon: <RefreshCw size={14} />, color: 'bg-[#FFA500]' };
            case 'SKIP': return { icon: <FastForward size={14} />, color: 'bg-[#00CD00]' };
            default: return { icon: <Square size={14} />, color: 'bg-[#FF0000]' };
        }
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 backdrop-blur-[2px]" dir="rtl">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl border border-slate-300 overflow-hidden font-sans max-h-[90vh] flex flex-col">

                {/* Header */}
                <div className="flex justify-between items-center px-4 py-2 border-b border-slate-200 bg-white">
                    <span className="font-bold text-slate-700 text-sm">טיפול בתהליכים</span>
                    <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded border border-slate-200 text-slate-400">
                        <X size={16} />
                    </button>
                </div>

                <div className="p-5 space-y-5 overflow-y-auto">

                    {/* בלוק הודעות שגיאה מהשרת */}
                    {errorItems.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2 shadow-inner animate-in fade-in">
                            <div className="flex items-center gap-2 text-red-700 font-bold text-xs">
                                <AlertTriangle size={14} />
                                שגיאה בביצוע הפעולה:
                            </div>
                            {errorItems.map((msg, idx) => (
                                <div key={idx} className="flex gap-2 text-[11px] text-red-800 border-t border-red-100 pt-1 first:border-0 first:pt-0">
                                    <span className="font-bold whitespace-nowrap">קוד {msg.msgCode}:</span>
                                    <span>{msg.msgBody}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* בלוק Port-In: מוצג רק אם מותר לעדכן תאריכים */}
                    {canUpdateDates && (
                        <div className="relative border border-blue-200 bg-blue-50/30 rounded p-4 pt-6 space-y-4">
                            <span className="absolute -top-3 right-4 bg-white border border-blue-200 px-2 text-[10px] font-bold text-blue-600 rounded">קליטת מספר (Port-In)</span>
                            <div className="grid grid-cols-2 gap-4">
                                <DateTimeInput label="מועד התחלת ניוד" date={portingDate} setDate={setPortingDate} time={portingTime} setTime={setPortingTime} />
                                <DateTimeInput label="מועד ביצוע ניוד" date={executeDate} setDate={setExecuteDate} time={executeTime} setTime={setExecuteTime} />
                            </div>
                            <button onClick={() => onActionExecute('UPDATE_DATES', groupId, { portingDate, portingTime, executeDate, executeTime })} className="bg-blue-600 text-white px-4 py-1.5 rounded text-[10px] font-bold hover:bg-blue-700 shadow-sm">עדכון מועד ניוד</button>
                        </div>
                    )}

                    {/* בלוק Republish: מוצג בשלב Publish */}
                    {/* בלוק Republish: מוצג בשלב Publish */}
                    {isPublishPhase && (
                        <div className="relative border border-amber-200 bg-amber-50/20 rounded p-4 pt-6 space-y-3">
                            <span className="absolute -top-3 right-4 bg-white border border-amber-200 px-2 text-[10px] font-bold text-amber-600 rounded">הפצה חוזרת (Republish)</span>

                            <div className="flex justify-between items-center mb-1 px-1 border-b border-amber-100 pb-2">
                                {/* כאן הצ'קבוקס החדש של בחירת הכל */}
                                <label className="flex items-center gap-2 cursor-pointer group">
                                    <input
                                        type="checkbox"
                                        className="rounded border-amber-300 text-amber-600 w-3.5 h-3.5 focus:ring-amber-500"
                                        checked={selectedOperators.length === networks.length && networks.length > 0}
                                        onChange={(e) => setSelectedOperators(e.target.checked ? networks.map(n => n.value) : [])}
                                    />
                                    <span className="text-[10px] font-bold text-amber-700 group-hover:underline">בחר את כל המפעילים</span>
                                </label>

                                <span className="text-[9px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded-full border border-amber-100">
                                    נבחרו: {selectedOperators.length}
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-2 max-h-32 overflow-y-auto p-2 bg-white/60 rounded border border-amber-50">
                                {networks.map((net: any) => (
                                    <label key={net.value} className="flex items-center gap-2 cursor-pointer hover:bg-amber-50 p-1 rounded transition-colors group">
                                        <input
                                            type="checkbox"
                                            checked={selectedOperators.includes(net.value)}
                                            onChange={() => toggleOperator(net.value)}
                                            className="rounded border-amber-300 text-amber-600 w-3 h-3"
                                        />
                                        <span className="text-[10px] text-slate-700 truncate">{net.display}</span>
                                    </label>
                                ))}
                            </div>

                            <button
                                disabled={selectedOperators.length === 0}
                                onClick={() => onActionExecute('REPUBLISH', groupId, { republishList: selectedOperators.join(',') })}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded text-[10px] font-bold transition-all shadow-sm
                ${selectedOperators.length > 0 ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-slate-200 text-slate-400'}`}
                            >
                                <Globe size={12} />
                                בצע הפצה חוזרת
                            </button>
                        </div>
                    )}

                    {/* תפעול שלב תהליכים */}
                    <div className="relative border border-slate-200 rounded p-4 pt-6 bg-slate-50/30">
                        <span className="absolute -top-3 right-4 bg-white px-2 text-[10px] font-bold text-slate-600 border border-slate-200 rounded">תפעול שלב תהליכים</span>
                        <div className="flex flex-col items-center space-y-4">
                            <div className="text-center font-bold text-slate-800 text-xs mb-2 leading-relaxed max-w-md">
                                {processes[0]?.state_desc || "לא קיימות העברות לרצף פעולות נוכחי"}
                            </div>
                            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                                {actions.map((action, idx) => {
                                    const config = getActionConfig(action.transitionType);
                                    return (
                                        <button key={idx} onClick={() => onActionExecute(action.stateTypeId, groupId)} className="flex items-center gap-2 group transition-all text-right">
                                            <div className={`${config.color} text-white p-2 w-8 h-8 rounded-l-none rounded-r-full flex items-center justify-center shadow-md group-hover:brightness-90 transition-all`}>
                                                {config.icon}
                                            </div>
                                            <span className="text-[10px] text-slate-600 leading-tight group-hover:text-blue-600 font-medium">{action.stateDesc}</span>
                                        </button>
                                    );
                                })}
                                <button onClick={() => onActionExecute('M0.1', groupId)} className="flex items-center gap-2 group transition-all">
                                    <div className="bg-red-600 text-white p-2 w-8 h-8 rounded-l-none rounded-r-full shadow-md group-hover:bg-red-700 flex items-center justify-center transition-all">
                                        <Square size={14} fill="white" />
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-700">M0.1 Terminate</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* מזהה קבוצת טיפול */}
                    <div className="relative border border-slate-200 rounded p-4 pt-6">
                        <span className="absolute -top-3 right-4 bg-white px-2 text-[10px] font-bold text-slate-600 border border-slate-200 rounded">מזהה קבוצת טיפול</span>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                disabled={!groupId.trim()}
                                onClick={() => onActionExecute('SET_GROUP', groupId)}
                                className={`px-4 py-1.5 border rounded text-[10px] font-bold transition-all 
                                    ${groupId.trim() ? 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 shadow-sm' : 'bg-slate-50 border-transparent text-slate-300 cursor-not-allowed'}`}
                            >
                                החל קבוצת טיפול
                            </button>
                            <input
                                type="text"
                                value={groupId}
                                onChange={(e) => setGroupId(e.target.value)}
                                className="border border-slate-300 rounded px-2 py-1 w-48 text-left text-sm focus:outline-none focus:ring-1 focus:ring-blue-400 font-mono"
                                placeholder="מזהה קבוצה..."
                            />
                            <label className="text-[10px] text-slate-500 whitespace-nowrap font-bold">מזהה קבוצת טיפול</label>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// רכיב עזר פנימי לשדות תאריך/זמן
const DateTimeInput = ({ label, date, setDate, time, setTime }: any) => (
    <div className="space-y-1 text-right">
        <label className="text-[10px] font-bold text-slate-500 block">{label}</label>
        <div className="flex gap-1 justify-end">
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="border border-slate-200 rounded px-2 py-1 text-xs w-20 outline-none focus:ring-1 focus:ring-blue-400" />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="border border-slate-200 rounded px-2 py-1 text-xs w-32 outline-none focus:ring-1 focus:ring-blue-400" />
        </div>
    </div>
);