import React, { useState, useEffect } from 'react';
import { Search, Calendar, Clock, AlertCircle, Filter } from 'lucide-react';
import { toast } from "sonner";

export const HistoryFilters = ({ initialTaskId, onSearch, actionTypeList = [] }: any) => {
    const [errors, setErrors] = useState<any>({});

    const getLastWeekDate = () => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return d.toISOString().split('T')[0];
    };

    const [filters, setFilters] = useState({
        dateFrom: getLastWeekDate(),
        dateTo: new Date().toISOString().split('T')[0],
        timeFrom: "00:00",
        timeTo: "23:59",
        byActionType: "0",
        byActionMode: "0"
    });

    const handleSearchClick = () => {
        const newErrors: any = {};

        // ולידציה 1: חובת בחירה בחיפוש כללי
        if (initialTaskId === "-1" && filters.byActionType === "0" && filters.byActionMode === "0") {
            newErrors.general = "יש לבחור שם פעולה או שיטת הפעלה לביצוע חיפוש כללי";
        }

        // ולידציה 2: בדיקת תאריכים
        const from = new Date(`${filters.dateFrom}T${filters.timeFrom}`);
        const to = new Date(`${filters.dateTo}T${filters.timeTo}`);
        if (from > to) {
            newErrors.dates = "תאריך התחלה לא יכול להיות מאוחר מתאריך סיום";
        }

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        onSearch(filters);
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-sm">
            {/* כותרת הפילטרים */}
            <div className="flex items-center gap-2 mb-5 text-slate-700 font-bold text-sm border-b border-slate-200 pb-3">
                <div className="bg-[#4B9CD3] p-1 rounded-md text-white shadow-sm">
                    <Filter size={14} />
                </div>
                <span>
                    {initialTaskId === "-1" || initialTaskId === "ALL"
                        ? "חיפוש היסטוריית משימות כללי"
                        : `סינון היסטוריה (משימה: ${initialTaskId})`}
                </span>
            </div>

            {/* מיכל הפילטרים */}
            <div className="flex flex-wrap gap-x-12 gap-y-4 items-start">

                {/* עמודה 1: טווח תאריכים */}
                <div className={`space-y-3 p-2 rounded-lg transition-all ${errors.dates ? 'bg-red-50/50 ring-1 ring-red-100' : ''}`}>
                    <div className="flex items-center gap-3">
                        <label className="text-[11px] font-bold text-slate-500 w-16 shrink-0">מתאריך:</label>
                        <div className="flex gap-2">
                            <input
                                type="date"
                                className={`border rounded px-2 py-1.5 text-xs w-36 outline-none ${errors.dates ? 'border-red-400' : 'border-slate-200 focus:border-[#4B9CD3]'}`}
                                value={filters.dateFrom}
                                onChange={e => { setFilters({ ...filters, dateFrom: e.target.value }); setErrors({}); }}
                            />
                            <input
                                type="time"
                                className={`border rounded px-2 py-1.5 text-xs w-24 outline-none ${errors.dates ? 'border-red-400' : 'border-slate-200 focus:border-[#4B9CD3]'}`}
                                value={filters.timeFrom}
                                onChange={e => { setFilters({ ...filters, timeFrom: e.target.value }); setErrors({}); }}
                            />
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="text-[11px] font-bold text-slate-500 w-16 shrink-0">עד תאריך:</label>
                        <div className="flex gap-2">
                            <input
                                type="date"
                                className={`border rounded px-2 py-1.5 text-xs w-36 outline-none ${errors.dates ? 'border-red-400' : 'border-slate-200 focus:border-[#4B9CD3]'}`}
                                value={filters.dateTo}
                                onChange={e => { setFilters({ ...filters, dateTo: e.target.value }); setErrors({}); }}
                            />
                            <input
                                type="time"
                                className={`border rounded px-2 py-1.5 text-xs w-24 outline-none ${errors.dates ? 'border-red-400' : 'border-slate-200 focus:border-[#4B9CD3]'}`}
                                value={filters.timeTo}
                                onChange={e => { setFilters({ ...filters, timeTo: e.target.value }); setErrors({}); }}
                            />
                        </div>
                    </div>
                    {errors.dates && <p className="text-[10px] text-red-600 font-bold mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.dates}</p>}
                </div>

                {/* עמודה 2: שם פעולה ושיטה */}
                <div className={`space-y-3 p-2 rounded-lg transition-all ${errors.general ? 'bg-red-50/50 ring-1 ring-red-100' : ''}`}>
                    <div className="flex items-center gap-3">
                        <label className="text-[11px] font-bold text-slate-500 w-24 shrink-0">שם פעולה:</label>
                        <select
                            className={`border rounded px-2 py-1.5 text-xs w-56 outline-none bg-white ${errors.general ? 'border-red-400' : 'border-slate-200 focus:border-[#4B9CD3]'}`}
                            value={filters.byActionType}
                            onChange={e => { setFilters({ ...filters, byActionType: e.target.value }); setErrors({}); }}
                        >
                            <option value="0">-לכל הפעולות-</option>
                            {actionTypeList.map((item: any) => (
                                <option key={item.value} value={item.value}>{item.displayValue}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="text-[11px] font-bold text-slate-500 w-24 shrink-0">שיטת הפעלה:</label>
                        <select
                            className={`border rounded px-2 py-1.5 text-xs w-56 outline-none bg-white ${errors.general ? 'border-red-400' : 'border-slate-200 focus:border-[#4B9CD3]'}`}
                            value={filters.byActionMode}
                            onChange={e => { setFilters({ ...filters, byActionMode: e.target.value }); setErrors({}); }}
                        >
                            <option value="0">-ללא-</option>
                            <option value="SCHEDULED">מתוכנן</option>
                            <option value="MANUALLY">יזום</option>
                        </select>
                    </div>
                    {errors.general && <p className="text-[10px] text-red-600 font-bold mt-1 flex items-center gap-1"><AlertCircle size={12} /> {errors.general}</p>}
                </div>
            </div>

            {/* שורת הכפתור - בדיוק כמו ב-Events */}
            <div className="flex justify-start gap-2 mt-6 pt-3 border-t border-slate-100">
                <button
                    type="button"
                    onClick={handleSearchClick}
                    className="bg-[#4B9CD3] text-white px-6 py-1.5 rounded text-xs font-bold hover:bg-[#357ABD] transition-colors shadow-sm"
                >
                    חיפוש
                </button>
            </div>
        </div>
    );
};