import React, { useState } from 'react';
import { Filter, AlertCircle } from 'lucide-react';
import { NpgDatePicker } from '../Share/NpgDatePicker'; // הייבוא החדש

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

        // ולידציה 2: בדיקת תאריכים (נשארת זהה לחלוטין)
        const from = new Date(`${filters.dateFrom}T${filters.timeFrom}`);
        const to = new Date(`${filters.dateTo}T${filters.timeTo}`);
        if (from > to) {
            newErrors.dates = "תאריך התחלה לא יכול להיות מאוחר מתאריך סיום";
        }

        setErrors(newErrors);
        if (Object.keys(newErrors).length > 0) return;

        onSearch(filters);
    };

    // פונקציית עזר לפיצול מחרוזת ה-NpgDatePicker חזרה לסטייט המקורי
    const handleDateChange = (val: string, dateField: string, timeField: string) => {
        if (!val) return;
        const [d, t] = val.split('T');
        setFilters(prev => ({ ...prev, [dateField]: d, [timeField]: t || '00:00' }));
        setErrors((prev: any) => {
            const newErr = { ...prev };
            delete newErr.dates;
            return newErr;
        });
    };

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6 shadow-sm rtl" dir="rtl">
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

            <div className="flex flex-wrap gap-x-12 gap-y-4 items-start">
                {/* עמודה 1: טווח תאריכים (שודרג עם הקומפוננטה שלנו) */}
                <div className={`space-y-3 p-2 rounded-lg transition-all ${errors.dates ? 'bg-red-50/50 ring-1 ring-red-100' : ''}`}>
                    <div className="flex items-start gap-3 min-h-[32px]">
                        <label className="text-[11px] font-bold text-slate-500 w-16 shrink-0 mt-1.5">מתאריך:</label>
                        <div className="w-[200px]">
                            <NpgDatePicker
                                value={`${filters.dateFrom}T${filters.timeFrom}`}
                                onChange={(val) => handleDateChange(val, 'dateFrom', 'timeFrom')}
                                showTime={true}
                                error={errors.dates ? " " : undefined} // מעביר שגיאה רק למסגרת האדומה
                            />
                        </div>
                    </div>
                    <div className="flex items-start gap-3 min-h-[32px]">
                        <label className="text-[11px] font-bold text-slate-500 w-16 shrink-0 mt-1.5">עד תאריך:</label>
                        <div className="w-[200px]">
                            <NpgDatePicker
                                value={`${filters.dateTo}T${filters.timeTo}`}
                                onChange={(val) => handleDateChange(val, 'dateTo', 'timeTo')}
                                showTime={true}
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