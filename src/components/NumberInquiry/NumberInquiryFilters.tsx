import React, { useState, useMemo, useEffect } from 'react';
import { Search, RotateCcw, ChevronUp, ChevronDown, Check } from 'lucide-react';
import { useApp } from "@/context/AppContext";

export const NumberInquiryFilters = ({ onFilter, onReset, isOpen, setIsOpen, initialValues }: any) => {
    const { lovs } = useApp();
    const [errors, setErrors] = useState<Record<string, string>>({});

    const operatorOptions = useMemo(() => {
        return (lovs?.byBusiness?.item || []).filter((op: any) => op.label !== "-ללא-");
    }, [lovs]);

    const [filters, setFilters] = useState(initialValues);

    // האזנה לשינויים שמגיעים מהאבא (למשל אחרי הצלחה במודאל)
    useEffect(() => {
        if (initialValues) {
            setFilters(initialValues);
        }
    }, [initialValues]);

    const today = new Date().toISOString().split('T')[0];
    const initialFilters = {
        dnNumber: '',
        operators: [] as string[],
        fromDate: today,
        fromTime: '00:00',
        toDate: today,
        toTime: '23:59',
        showHistory: false
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!filters.dnNumber.trim()) {
            newErrors.dnNumber = "חובה להזין מספר";
        } else if (!/^\d+$/.test(filters.dnNumber)) {
            newErrors.dnNumber = "יש להזין ספרות בלבד";
        }
        if (filters.operators.length === 0) {
            newErrors.operators = "חובה לבחור לפחות מפעיל אחד";
        }
        const start = new Date(`${filters.fromDate}T${filters.fromTime}`);
        const end = new Date(`${filters.toDate}T${filters.toTime}`);
        if (start > end) {
            newErrors.dateRange = "תאריך התחלה חייב להיות קטן מתאריך סיום";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const toggleOperator = (id: string) => {
        const newOps = filters.operators.includes(id)
            ? filters.operators.filter(opId => opId !== id)
            : [...filters.operators, id];
        setFilters({ ...filters, operators: newOps });
    };

    const selectAllOperators = (checked: boolean) => {
        const allIds = operatorOptions.map((op: any) => op.value) || [];
        setFilters({ ...filters, operators: checked ? allIds : [] });
    };

    const handleReset = () => {
        setFilters(initialFilters);
        setErrors({});
        onReset();
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 mb-4 overflow-hidden rtl text-right" dir="rtl">
            <div onClick={() => setIsOpen(!isOpen)} className="bg-slate-50 px-4 py-2.5 flex justify-between items-center cursor-pointer border-b border-slate-200">
                <div className="flex items-center gap-2 text-slate-700 font-bold text-xs">
                    <Search size={14} className="text-blue-600" />
                    <span>סינון שאילתת מספר</span>
                </div>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>

            {isOpen && (
                <div className="p-4 space-y-4 transition-all">
                    <div className="flex flex-row gap-8 items-start">

                        {/* צד ימין - נתונים */}
                        <div className="w-[360px] space-y-3 shrink-0">
                            <div className="flex flex-col">
                                <div className="flex items-center gap-3 h-8">
                                    <label className="text-[11px] font-bold text-slate-600 w-20 shrink-0">מספר טלפון*</label>
                                    <input
                                        type="text"
                                        className={`w-[180px] border rounded px-2 py-1 text-[12px] outline-none h-7 transition-all ${errors.dnNumber ? 'border-red-500 bg-red-50' : 'border-slate-300'}`}
                                        value={filters.dnNumber}
                                        onChange={(e) => setFilters({ ...filters, dnNumber: e.target.value })}
                                    />
                                </div>
                                {errors.dnNumber && <span className="text-[10px] text-red-500 mr-24 mt-1 font-medium">{errors.dnNumber}</span>}
                            </div>

                            <div className="flex items-center gap-2 h-8 mr-[92px]">
                                <input
                                    id="history" type="checkbox" className="w-3.5 h-3.5 rounded text-blue-600 border-slate-300"
                                    checked={filters.showHistory}
                                    onChange={(e) => setFilters({ ...filters, showHistory: e.target.checked })}
                                />
                                <label htmlFor="history" className="text-[11px] text-slate-700 font-bold cursor-pointer">הצג היסטוריה</label>
                            </div>

                            <div className="flex items-center gap-3 h-8">
                                <label className="text-[11px] font-bold text-slate-600 w-20 shrink-0">מתאריך</label>
                                <div className="flex gap-2">
                                    <input type="date" className="w-[115px] border border-slate-300 rounded px-2 py-1 text-[11px] h-7" value={filters.fromDate} onChange={(e) => setFilters({ ...filters, fromDate: e.target.value })} />
                                    <input type="time" className="w-[60px] border border-slate-300 rounded px-2 py-1 text-[11px] h-7" value={filters.fromTime} onChange={(e) => setFilters({ ...filters, fromTime: e.target.value })} />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 h-8">
                                <label className="text-[11px] font-bold text-slate-600 w-20 shrink-0">עד תאריך</label>
                                <div className="flex gap-2">
                                    <input type="date" className="w-[115px] border border-slate-300 rounded px-2 py-1 text-[11px] h-7" value={filters.toDate} onChange={(e) => setFilters({ ...filters, toDate: e.target.value })} />
                                    <input type="time" className="w-[60px] border border-slate-300 rounded px-2 py-1 text-[11px] h-7" value={filters.toTime} onChange={(e) => setFilters({ ...filters, toTime: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        {/* צד שמאל - מפעילים (הגדלת גובה וסידור צפוף) */}
                        <div className="flex-1 flex flex-col min-w-0 border-r border-slate-100 pr-6 min-h-[220px]">
                            <div className="flex justify-between items-center mb-2">
                                <label className="text-[11px] font-bold text-slate-600">סנן לפי מפעיל* ({filters.operators.length} נבחרו)</label>
                                <div className="flex items-center gap-2 ml-2">
                                    <span className="text-[10px] text-slate-500 font-bold">בחר הכל</span>
                                    <input
                                        type="checkbox"
                                        className="w-3 h-3 rounded border-slate-300"
                                        checked={filters.operators.length === operatorOptions.length && operatorOptions.length > 0}
                                        onChange={(e) => selectAllOperators(e.target.checked)}
                                    />
                                </div>
                            </div>

                            {/* הגדלנו את max-h ל-300px ושינינו לגריד מרובה עמודות צפוף */}
                            <div className={`flex-1 border rounded-lg p-2 overflow-y-auto max-h-[300px] bg-slate-50/20 ${errors.operators ? 'border-red-300' : 'border-slate-200'}`}>
                                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-1.5 auto-rows-max">
                                    {operatorOptions.map((op: any) => (
                                        <div
                                            key={op.value}
                                            onClick={() => toggleOperator(op.value)}
                                            className={`flex items-center gap-2 px-2 py-1 rounded border cursor-pointer transition-all shrink-0 h-7 ${filters.operators.includes(op.value) ? 'bg-blue-50 border-blue-200 text-blue-700 shadow-sm' : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'}`}
                                        >
                                            <div className={`w-3 h-3 rounded-sm border flex items-center justify-center shrink-0 ${filters.operators.includes(op.value) ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300'}`}>
                                                {filters.operators.includes(op.value) && <Check size={8} strokeWidth={4} />}
                                            </div>
                                            <span className="text-[10px] font-bold truncate leading-none">{op.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {errors.operators && <span className="text-[10px] text-red-500 font-medium mt-1">{errors.operators}</span>}
                        </div>
                    </div>

                    <div className="flex justify-start gap-2 pt-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={() => validate() && onFilter(filters)}
                            className="bg-blue-600 text-white px-6 py-1.5 rounded text-xs font-bold hover:bg-blue-700 shadow-sm transition-all active:scale-95 flex items-center gap-2"
                        >
                            <Search size={14} /> בצע חיפוש
                        </button>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="bg-slate-100 text-slate-600 px-6 py-1.5 rounded text-xs font-bold hover:bg-slate-200 transition-all"
                        >
                            איפוס
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};