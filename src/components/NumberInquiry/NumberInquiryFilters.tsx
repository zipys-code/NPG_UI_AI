import React, { useState, useMemo, useEffect } from 'react';
import { Search, ChevronUp, ChevronDown, Check } from 'lucide-react';
import { useApp } from "@/context/AppContext";
import { NpgDatePicker } from '../Share/NpgDatePicker';

const FilterRow = ({ label, error, children }: { label: string, error?: string, children: React.ReactNode }) => (
    <div className="flex flex-col mb-1">
        <div className="flex items-start gap-3 min-h-[32px]">
            <label className="text-[11px] font-bold text-slate-600 w-24 text-right shrink-0 mt-1.5">{label}</label>
            <div className="w-[200px] flex flex-col">
                {children}
            </div>
        </div>
        {error && error !== " " && (
            <span className="text-[10px] text-red-600 font-semibold pr-[108px] mt-[-2px]">{error}</span>
        )}
    </div>
);

export const NumberInquiryFilters = ({ onFilter, onReset, isOpen, setIsOpen, initialValues }: any) => {
    const { lovs } = useApp();
    const [errors, setErrors] = useState<Record<string, string>>({});

    const operatorOptions = useMemo(() => {
        return (lovs?.byBusiness?.item || []).filter((op: any) => op.label !== "-ללא-");
    }, [lovs]);

    const initialFilters = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return {
            dnNumber: '',
            operators: [] as string[],
            fromDate: `${today}T00:00`,
            toDate: `${today}T23:59`,
            showHistory: false
        };
    }, []);

    const [filters, setFilters] = useState(initialValues || initialFilters);

    useEffect(() => {
        if (initialValues) {
            setFilters(initialValues);
        }
    }, [initialValues]);

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

        // ולידציה של התאריכים המאוחדים
        const start = new Date(filters.fromDate.replace(' ', 'T'));
        const end = new Date(filters.toDate.replace(' ', 'T'));
        if (start > end) {
            newErrors.fromDate = "תאריך התחלה חייב להיות מוקדם מסיום";
            newErrors.toDate = " ";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (field: string, value: any) => {
        setErrors(prev => {
            const newErr = { ...prev };
            delete newErr[field];
            if (field === 'fromDate' || field === 'toDate') {
                delete newErr.fromDate;
                delete newErr.toDate;
            }
            return newErr;
        });
        setFilters((prev: any) => ({ ...prev, [field]: value }));
    };

    const toggleOperator = (id: string) => {
        const newOps = filters.operators.includes(id)
            ? filters.operators.filter((opId: string) => opId !== id)
            : [...filters.operators, id];
        handleChange('operators', newOps);
    };

    const selectAllOperators = (checked: boolean) => {
        const allIds = operatorOptions.map((op: any) => op.value) || [];
        handleChange('operators', checked ? allIds : []);
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
                        <div className="w-[360px] shrink-0 pt-1">
                            <FilterRow label="מספר טלפון*" error={errors.dnNumber}>
                                <input
                                    type="text"
                                    className={`w-full border rounded px-2 py-1 text-[12px] outline-none h-7 transition-all shadow-sm ${errors.dnNumber ? 'border-red-500 bg-red-50 focus:ring-1 focus:ring-red-200' : 'border-slate-300 focus:border-blue-500 bg-white'}`}
                                    value={filters.dnNumber}
                                    onChange={(e) => handleChange('dnNumber', e.target.value)}
                                />
                            </FilterRow>

                            <div className="flex items-center gap-2 min-h-[32px] mr-[108px] mb-2">
                                <input
                                    id="history" type="checkbox" className="w-3.5 h-3.5 rounded text-blue-600 border-slate-300"
                                    checked={filters.showHistory}
                                    onChange={(e) => handleChange('showHistory', e.target.checked)}
                                />
                                <label htmlFor="history" className="text-[11px] text-slate-700 font-bold cursor-pointer">הצג היסטוריה</label>
                            </div>

                            {/* רכיב התאריך המאוחד - ללא error מועבר ל-FilterRow */}
                            <FilterRow label="מתאריך">
                                <NpgDatePicker
                                    value={filters.fromDate}
                                    onChange={(val) => handleChange('fromDate', val)}
                                    showTime={true}
                                    error={errors.fromDate}
                                />
                            </FilterRow>

                            <FilterRow label="עד תאריך">
                                <NpgDatePicker
                                    value={filters.toDate}
                                    onChange={(val) => handleChange('toDate', val)}
                                    showTime={true}
                                    error={errors.toDate}
                                />
                            </FilterRow>
                        </div>

                        {/* צד שמאל - מפעילים */}
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

                            <div className={`flex-1 border rounded-lg p-2 overflow-y-auto max-h-[300px] bg-slate-50/20 ${errors.operators ? 'border-red-300 bg-red-50' : 'border-slate-200'}`}>
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