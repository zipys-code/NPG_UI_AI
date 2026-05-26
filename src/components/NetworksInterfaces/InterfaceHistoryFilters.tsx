import React, { useState } from 'react';
import { Search, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';

export const InterfaceHistoryFilters = ({ onSearch }: { onSearch: (filters: any) => void }) => {
    const [isOpen, setIsOpen] = useState(false);

    // הגדרת ברירת מחדל: מהיום בחצות עד סוף היום
    const [filters, setFilters] = useState({
        selectedOperator: 'ALL',
        interfaceDirection: '', // "נכנס", "יוצא" או ריק ל"ללא"
        fromDate: new Date().toISOString().split('T')[0],
        fromTime: '00:00',
        toDate: new Date().toISOString().split('T')[0],
        toTime: '23:59'
    });

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-6">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors"
            >
                <span className="text-sm font-bold text-blue-700 flex items-center gap-2">
                    היסטוריית מצבים:
                </span>
                {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {isOpen && (
                <div className="p-6 border-t border-slate-200 bg-[#fcfcfc] animate-in fade-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* סוג ממשק */}
                        <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-bold text-slate-500">סוג ממשק:</label>
                            <select
                                className="border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-600"
                                value={filters.interfaceDirection}
                                onChange={(e) => setFilters({ ...filters, interfaceDirection: e.target.value })}
                            >
                                <option value="">-ללא-</option>
                                <option value="נכנס">נכנס</option>
                                <option value="יוצא">יוצא</option>
                            </select>
                        </div>

                        {/* תאריך התחלה */}
                        <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-bold text-slate-500">מתאריך:</label>
                            <div className="flex gap-2">
                                <input type="date" className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={filters.fromDate} />
                                <input type="time" className="w-24 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={filters.fromTime} />
                            </div>
                        </div>

                        {/* תאריך סיום */}
                        <div className="flex flex-col gap-1">
                            <label className="text-[11px] font-bold text-slate-500">עד תאריך:</label>
                            <div className="flex gap-2">
                                <input type="date" className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={filters.toDate} />
                                <input type="time" className="w-24 border border-slate-200 rounded-lg px-3 py-2 text-sm" value={filters.toTime} />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-100">
                        <button className="flex items-center gap-2 px-4 py-2 text-slate-600 font-bold text-sm hover:bg-slate-100 rounded-lg transition-all">
                            <RotateCcw size={18} /> איפוס
                        </button>
                        <button
                            onClick={() => onSearch(filters)}
                            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white font-bold text-sm rounded-lg shadow-md hover:bg-blue-700 transition-all"
                        >
                            <Search size={18} /> בצע חיפוש
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};