import React, { useState } from 'react';
import { X, Search, Calendar, ArrowLeftRight, History, AlertCircle } from 'lucide-react';
import { InterfaceHistoryGrid } from './InterfaceHistoryGrid';

interface HistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    operatorName: string;
    data: any[];
    loading: boolean;
    onSearch: (filters: any) => void;
}

export const InterfaceHistoryModal = ({ isOpen, onClose, operatorName, data, loading, onSearch }: HistoryModalProps) => {

    const getLocalDate = () => {
        const now = new Date();
        const offset = now.getTimezoneOffset() * 60000; // הפרש דקות למילישניות
        const localISOTime = (new Date(now.getTime() - offset)).toISOString().slice(0, 10);
        return localISOTime;
    };

    const [interfaceType, setInterfaceType] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [fromDate, setFromDate] = useState(getLocalDate());
    const [toDate, setToDate] = useState(getLocalDate());
    if (!isOpen) return null;

    const handleSearchClick = () => {
        // איפוס שגיאות
        setError(null);

        // ולידציה: בדיקה שמתאריך לא מאוחר מעד תאריך
        if (new Date(fromDate) > new Date(toDate)) {
            setError("טווח תאריכים לא תקין: תאריך ההתחלה חייב להיות מוקדם מתאריך הסיום");
            return;
        }

        const formatDate = (dateStr: string, isEnd: boolean) => {
            const [y, m, d] = dateStr.split('-');
            return `${d}/${m}/${y} ${isEnd ? '23:59:59' : '00:00:00'}`;
        };

        onSearch({
            fromDate: formatDate(fromDate, false),
            toDate: formatDate(toDate, true),
            interface_direction: interfaceType
        });
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4" dir="rtl">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">

                {/* Header - גובה מצומצם וקבוע */}
                <div className="bg-blue-600 px-6 py-2.5 flex justify-between items-center text-white shrink-0 shadow-md">
                    <div className="flex items-center gap-3">
                        <History size={20} />
                        <h3 className="font-bold text-base">היסטוריית שינויים: {operatorName}</h3>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors p-1">
                        <X size={22} />
                    </button>
                </div>

                {/* Filters Area - קומפקטי בשורה אחת */}
                <div className="p-3 bg-slate-50 border-b border-slate-200 shrink-0">
                    <div className="flex flex-wrap items-center gap-6">

                        {/* מתאריך */}
                        <div className="flex items-center gap-3">
                            <label className={`text-[11px] font-bold shrink-0 w-16 ${error ? 'text-red-500' : 'text-slate-500'}`}>מתאריך:</label>
                            <input
                                type="date"
                                className={`border rounded px-2 py-1.5 text-xs w-36 outline-none transition-all ${error ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-blue-600'
                                    }`}
                                value={fromDate}
                                onChange={(e) => { setFromDate(e.target.value); setError(null); }}
                            />
                        </div>

                        {/* עד תאריך */}
                        <div className="flex items-center gap-3">
                            <label className={`text-[11px] font-bold shrink-0 w-16 ${error ? 'text-red-500' : 'text-slate-500'}`}>עד תאריך:</label>
                            <input
                                type="date"
                                className={`border rounded px-2 py-1.5 text-xs w-36 outline-none transition-all ${error ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-blue-600'
                                    }`}
                                value={toDate}
                                onChange={(e) => { setToDate(e.target.value); setError(null); }}
                            />
                        </div>

                        {/* סוג ממשק */}
                        <div className="flex items-center gap-3">
                            <label className="text-[11px] font-bold text-slate-500 shrink-0 w-16">סוג ממשק:</label>
                            <select
                                className="border border-slate-200 rounded px-2 py-1.5 text-xs w-32 bg-white font-medium outline-none focus:border-blue-600"
                                value={interfaceType}
                                onChange={(e) => setInterfaceType(e.target.value)}
                            >
                                <option value="">הכל</option>
                                <option value="in">נכנס</option>
                                <option value="out">יוצא</option>
                            </select>
                        </div>

                        {/* כפתור חיפוש קטן וצמוד */}
                        <button
                            onClick={handleSearchClick}
                            disabled={loading}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-8 px-4 rounded text-xs flex items-center gap-2 transition-all active:scale-95 disabled:bg-slate-300"
                        >
                            {loading ? <div className="w-3 h-3 border-2 border-white/30 border-b-white rounded-full animate-spin" /> : <Search size={14} />}
                            חיפוש
                        </button>
                    </div>

                    {/* הודעת שגיאה - צפה מתחת לשורה */}
                    {error && (
                        <div className="mt-2 flex items-center gap-1.5 text-red-600 text-[10px] font-bold animate-in fade-in slide-in-from-top-1">
                            <AlertCircle size={12} />
                            {error}
                        </div>
                    )}
                </div>

                {/* תוכן הגריד - זה החלק שגדל ומאפשר גלילה פנימית */}
                <div className="flex-1 overflow-auto p-4 relative bg-white min-h-0">
                    <InterfaceHistoryGrid data={data} />
                </div>

                {/* Footer - גובה מצומצם ומיושר לשמאל */}
                <div className="p-3 bg-slate-50 border-t text-left shrink-0">
                    <button onClick={onClose} className="px-6 py-1.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors shadow-sm bg-white">
                        סגור
                    </button>
                </div>
            </div>
        </div>
    );
};