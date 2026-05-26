import React, { useMemo, useState } from 'react';
import { CheckCircle2, XCircle, ArrowUpDown, ArrowUp, ArrowDown, Info } from 'lucide-react';

export const HistoryGrid = ({ data, loading }: any) => {
    const [sortConfig, setSortConfig] = useState({
        key: 'actionEndDate',
        direction: 'desc'
    });

    // ניהול שורה נבחרת להצגת שגיאה מלאה
    const [expandedRow, setExpandedRow] = useState<number | null>(null);
    // פונקציית עזר לחיתוך טקסט
    const truncateText = (text: string, limit: number) => {
        if (!text) return "";
        if (text.length <= limit) return text;
        return text.substring(0, limit) + '...';
    };

    const parseFullDateTime = (dateTimeStr: string) => {
        if (!dateTimeStr) return new Date(0);
        try {
            const [datePart, timePart] = dateTimeStr.split(' ');
            const [day, month, year] = datePart.split('/');
            return new Date(`${year}-${month}-${day}T${timePart || '00:00'}`);
        } catch (e) { return new Date(0); }
    };

    const sortedData = useMemo(() => {
        let sortableItems = [...data];
        sortableItems.sort((a, b) => {
            let aValue, bValue;
            if (sortConfig.key === 'actionStartDate' || sortConfig.key === 'actionEndDate') {
                aValue = parseFullDateTime(a[sortConfig.key]).getTime();
                bValue = parseFullDateTime(b[sortConfig.key]).getTime();
            } else {
                aValue = (a[sortConfig.key] || '').toString().toLowerCase();
                bValue = (b[sortConfig.key] || '').toString().toLowerCase();
            }
            if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
        return sortableItems;
    }, [data, sortConfig]);

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const renderSortableHeader = (label: string, key: string, className = "") => {
        const isActive = sortConfig.key === key;
        return (
            <th onClick={() => requestSort(key)} className={`px-4 py-3 text-right text-[11px] font-bold text-slate-500 uppercase cursor-pointer hover:bg-slate-100 transition-colors group select-none ${className}`}>
                <div className="flex items-center gap-1">
                    {label}
                    <span className={isActive ? 'text-blue-600' : 'text-slate-300 opacity-0 group-hover:opacity-100'}>
                        {isActive ? (sortConfig.direction === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} />}
                    </span>
                </div>
            </th>
        );
    };

    return (
        <div className="overflow-visible bg-white rounded-lg shadow-sm border border-slate-200 pb-20">
            <table className="min-w-full divide-y divide-slate-200 text-right relative mb-12">
                <thead className="bg-slate-50">
                    <tr>
                        {renderSortableHeader("שם פעולה", "activationName")}
                        {renderSortableHeader("תאריך התחלה", "actionStartDate")}
                        {renderSortableHeader("תאריך סיום", "actionEndDate")}
                        {renderSortableHeader("סטטוס", "actionStatus", "w-24 text-center")}
                        <th className="px-4 py-3 text-[11px] font-bold text-slate-500 w-24">שיטה</th>
                        <th className="px-4 py-3 text-[11px] font-bold text-slate-500">תיאור תוצאות</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                    {loading ? (
                        <tr><td colSpan={6} className="text-center py-10 text-slate-400 italic">טוען נתונים...</td></tr>
                    ) : sortedData.map((row, idx) => {
                        const fullError = row.errorDesc || row.actionDesc || "";
                        const isError = row.actionStatus === 'ERROR';

                        return (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors relative">
                                <td className="px-4 py-3 text-[12px] font-bold text-slate-700">{row.activationName || '-'}</td>
                                <td className="px-4 py-3 text-[11px] text-slate-600 tabular-nums">{row.actionStartDate || '-'}</td>
                                <td className="px-4 py-3 text-[11px] text-slate-600 tabular-nums">{row.actionEndDate || '-'}</td>
                                <td className="px-4 py-3 text-center">
                                    {row.actionStatus === 'SUCCESS' ? (
                                        <div className="flex flex-col items-center gap-0.5 text-[9px] text-emerald-600 font-bold uppercase">
                                            <CheckCircle2 size={18} />
                                            <span>Success</span>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-0.5 text-[9px] text-red-600 font-bold uppercase">
                                            <XCircle size={18} />
                                            <span>Error</span>
                                        </div>
                                    )}
                                </td>
                                <td className="px-4 py-3">
                                    <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600">
                                        {row.activationMode || '-'}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-[11px] relative w-[40%] min-w-[250px] max-w-[450px]">
                                    <div className="flex items-center gap-2 justify-start">
                                        <span
                                            className={`truncate leading-relaxed ${isError ? 'text-red-600 font-medium' : 'text-slate-500'}`}
                                            title={fullError.length > 80 ? "" : fullError} // מציג טיפ רגיל רק אם זה קצר
                                        >
                                            {truncateText(fullError || (row.actionStatus === 'SUCCESS' ? 'בוצע בהצלחה' : '-'), 80)}
                                        </span>

                                        {fullError.length > 80 && (
                                            <button
                                                onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                                                className="text-blue-500 hover:text-blue-700 shrink-0 p-1 hover:bg-blue-50 rounded-full transition-colors"
                                            >
                                                <Info size={14} />
                                            </button>
                                        )}
                                    </div>

                                    {/* ה-Popover נפתח בצורה חכמה יותר */}
                                    {expandedRow === idx && (
                                        <div className="absolute z-50 left-0 top-10 w-96 p-3 bg-white border border-slate-200 shadow-xl rounded-lg text-slate-700">
                                            <div className="flex justify-between items-center mb-2 border-b pb-1 text-[10px] font-bold text-slate-400">
                                                <span>תיאור שגיאה מלא</span>
                                                <button onClick={() => setExpandedRow(null)} className="hover:text-slate-600">✕</button>
                                            </div>
                                            <div className="max-h-40 overflow-y-auto text-[11px] leading-relaxed break-words select-all bg-slate-50 p-2 rounded border border-slate-100 italic">
                                                {fullError}
                                            </div>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};