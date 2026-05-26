import React, { useState, useMemo, useRef, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import { AutocompleteField } from '../Share/AutocompleteField';

const getFormattedDate = (daysOffset = 0) => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    date.setHours(0, 0, 0, 0);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T00:00`;
};

const FilterRow = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div className="flex items-center gap-3 h-7">
        <label className="text-[11px] font-medium text-slate-600 w-32 text-right shrink-0">{label}</label>
        <div className="w-[200px]">{children}</div>
    </div>
);

/* const AutocompleteField = ({ label, options, value, onChange, placeholder = "-בחר-", hasError = false }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);
    const currentLabel = options.find((opt: any) => opt.value === value)?.label || '';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="flex items-center gap-3 h-7 relative" ref={wrapperRef}>
            <label className="text-[11px] font-medium text-slate-600 w-32 text-right shrink-0">{label}</label>
            <div className="w-[200px] relative">
                <input
                    type="text"
                    className={`w-full rounded border px-2 py-1 text-[11px] outline-none h-7 shadow-sm text-right transition-all ${hasError ? 'border-red-500 bg-red-50 ring-1 ring-red-200' : 'border-slate-300 bg-white focus:border-blue-500'
                        }`}
                    placeholder={currentLabel || placeholder}
                    value={isOpen ? searchTerm : currentLabel}
                    onFocus={() => { setIsOpen(true); setSearchTerm(''); }}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {isOpen && (
                    <div className="absolute top-full right-0 left-0 z-[110] mt-1 max-h-40 overflow-y-auto rounded border border-slate-200 bg-white shadow-lg text-right">
                        <div className="px-2 py-1 text-[11px] hover:bg-blue-50 cursor-pointer text-slate-400" onClick={() => { onChange(''); setIsOpen(false); }}>-ללא-</div>
                        {options.filter((o: any) => o.label.includes(searchTerm)).map((opt: any) => (
                            <div key={opt.value} className="px-2 py-1 text-[11px] hover:bg-blue-50 cursor-pointer text-slate-700 border-b border-slate-50 last:border-0"
                                onClick={() => { onChange(opt.value); setIsOpen(false); }}>
                                {opt.label}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}; */

export const DnRouteNumbersFilters = ({ onFilter, onReset, isOpen, setIsOpen }: any) => {
    const { lovs } = useApp();
    //const [isOpen, setIsOpen] = useState(true);
    const [errors, setErrors] = useState<string[]>([]);

    const initialFilters = {
        filterByNum: '',
        mobileStart: '',
        mobileEnd: '',
        requestId: '',
        operatorDonor: '',
        operatorRecipient: '',
        networkType: '',
        portType: '',
        selectByDate: '0',
        fromDate: getFormattedDate(-1),
        toDate: getFormattedDate(0),
        includeHistory: false
    };

    const [filters, setFilters] = useState(initialFilters);

    const handleChange = (field: string, value: any) => {
        setErrors(prev => prev.filter(err => err !== field));
        let finalValue = value;
        if (field === 'requestId') finalValue = value.toUpperCase();
        if ((field === 'mobileStart' || field === 'mobileEnd') && value !== '' && !/^\d+$/.test(value)) return;
        setFilters(prev => ({ ...prev, [field]: finalValue }));
    };

    const validate = () => {
        const newErrors: string[] = [];
        if (filters.requestId && !filters.requestId.startsWith('NP')) {
            toast.error("מזהה בקשה חייב להתחיל ב-NP");
            newErrors.push('requestId');
        }
        if (filters.selectByDate === '1') {
            if (new Date(filters.fromDate) > new Date(filters.toDate)) {
                toast.error("תאריך התחלה חייב להיות מוקדם מתאריך סיום");
                newErrors.push('fromDate', 'toDate');
            }
        }
        if (filters.filterByNum === "SINGLE" && !filters.mobileStart) newErrors.push('mobileStart');
        if (filters.filterByNum === "RANGE" && (!filters.mobileStart || !filters.mobileEnd)) newErrors.push('mobileStart', 'mobileEnd');

        setErrors(newErrors);
        return newErrors.length === 0;
    };

    const inputClass = (field: string) => `w-[200px] border rounded px-2 py-1 h-7 text-[11px] outline-none transition-all shadow-sm text-right ${errors.includes(field) ? 'border-red-500 bg-red-50 ring-1 ring-red-200' : 'border-slate-300 bg-white text-slate-700 focus:border-blue-500'
        }`;

    return (
        <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 mb-4 overflow-hidden" dir="rtl">
            <div className="flex items-center justify-start gap-2 p-2.5 px-4 cursor-pointer hover:bg-slate-50 bg-slate-50/30"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <ChevronUp size={14} className="text-blue-600" /> : <ChevronDown size={14} className="text-blue-600" />}
                <span className="text-[12px] font-bold text-blue-700">סינון נוכחי</span>
            </div>
            {isOpen && (
                <div className="p-4">
                    <form onSubmit={(e) => { e.preventDefault(); if (validate()) onFilter(filters); }}>
                        <div className="grid grid-cols-2 gap-x-12 gap-y-2 w-fit">
                            <div className="space-y-2">
                                <FilterRow label="סנן לפי מספר">
                                    <select className={inputClass('filterByNum')} value={filters.filterByNum} onChange={(e) => handleChange('filterByNum', e.target.value)}>
                                        <option value="">-ללא-</option>
                                        <option value="SINGLE">לפי מספר</option>
                                        <option value="RANGE">לפי טווח מספרים</option>
                                    </select>
                                </FilterRow>
                                {filters.filterByNum && (
                                    <>
                                        <FilterRow label={filters.filterByNum === "SINGLE" ? "מספר" : "תחילת טווח"}>
                                            <input type="text" className={inputClass('mobileStart')} value={filters.mobileStart} onChange={(e) => handleChange('mobileStart', e.target.value)} />
                                        </FilterRow>
                                        {filters.filterByNum === "RANGE" && (
                                            <FilterRow label="סוף טווח">
                                                <input type="text" className={inputClass('mobileEnd')} value={filters.mobileEnd} onChange={(e) => handleChange('mobileEnd', e.target.value)} />
                                            </FilterRow>
                                        )}
                                    </>
                                )}
                                <FilterRow label="מזהה בקשה">
                                    <input type="text" className={inputClass('requestId')} value={filters.requestId} onChange={(e) => handleChange('requestId', e.target.value)} placeholder="...NP" />
                                </FilterRow>
                                <AutocompleteField label="מפעיל ננטש" options={lovs?.['byBusiness']?.item || []} value={filters.operatorDonor} onChange={(v: any) => handleChange('operatorDonor', v)} hasError={errors.includes('operatorDonor')} />
                                <AutocompleteField label="מפעיל קולט" options={lovs?.['byBusiness']?.item || []} value={filters.operatorRecipient} onChange={(v: any) => handleChange('operatorRecipient', v)} hasError={errors.includes('operatorRecipient')} />
                            </div>
                            <div className="space-y-2">
                                <FilterRow label="סנן לפי תאריכים">
                                    <select className={inputClass('selectByDate')} value={filters.selectByDate} onChange={(e) => handleChange('selectByDate', e.target.value)}>
                                        <option value="0">-ללא-</option>
                                        <option value="1">לפי תאריכים</option>
                                    </select>
                                </FilterRow>
                                {filters.selectByDate === '1' && (
                                    <>
                                        <FilterRow label="מתאריך">
                                            <input type="datetime-local" className={inputClass('fromDate')} value={filters.fromDate} onChange={(e) => handleChange('fromDate', e.target.value)} />
                                        </FilterRow>
                                        <FilterRow label="עד תאריך">
                                            <input type="datetime-local" className={inputClass('toDate')} value={filters.toDate} onChange={(e) => handleChange('toDate', e.target.value)} />
                                        </FilterRow>
                                        <div className="flex items-center gap-3 h-7">
                                            <label className="text-[11px] font-medium text-slate-600 w-32 text-right shrink-0">כולל היסטוריה</label>
                                            <input type="checkbox" className="w-4 h-4 accent-blue-600 cursor-pointer" checked={filters.includeHistory} onChange={(e) => handleChange('includeHistory', e.target.checked)} />
                                        </div>
                                    </>
                                )}
                                <AutocompleteField label="רשת" options={lovs?.['byNetwork']?.item || []} value={filters.networkType} onChange={(v: any) => handleChange('networkType', v)} />
                                <FilterRow label="סוג ניוד">
                                    <select className={inputClass('portType')} value={filters.portType} onChange={(e) => handleChange('portType', e.target.value)}>
                                        <option value="">-ללא-</option>
                                        <option value="EXTERNAL">חיצוני</option>
                                        <option value="INTERNAL">פנימי</option>
                                    </select>
                                </FilterRow>
                            </div>
                        </div>
                        <div className="flex justify-start gap-2 mt-6 pt-3 border-t border-slate-100">
                            <button type="submit" className="bg-[#4B9CD3] text-white px-6 py-1.5 rounded text-xs font-bold hover:bg-[#357ABD] transition-colors shadow-sm">בצע חיפוש</button>
                            <button type="button" onClick={() => { setFilters(initialFilters); setErrors([]); onReset(); }} className="border border-slate-300 bg-slate-50 text-slate-600 px-6 py-1.5 rounded text-xs font-bold hover:bg-slate-100 transition-all">איפוס</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};