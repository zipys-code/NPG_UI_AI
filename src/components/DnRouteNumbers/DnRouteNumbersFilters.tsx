import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useApp } from "@/context/AppContext";
import { toast } from "sonner"; // נשאר למקרים של שגיאות כלליות
import { AutocompleteField } from '../Share/AutocompleteField';
import { NpgDatePicker } from '../Share/NpgDatePicker';

const getFormattedDate = (daysOffset = 0) => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    date.setHours(0, 0, 0, 0);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T00:00`;
};

const FilterRow = ({ label, error, children }: { label: string, error?: string, children: React.ReactNode }) => (
    <div className="flex items-start gap-3 mb-2">
        <label className="text-[11px] font-medium text-slate-600 w-32 text-right shrink-0 mt-1.5">{label}</label>
        <div className="w-[200px] flex flex-col gap-1">
            {children}
            {error && error !== " " && (
                <span className="text-[10px] text-red-600 font-semibold pr-1 mt-[-2px]">{error}</span>
            )}
        </div>
    </div>
);

const getCleanOptions = (items: any) => {
    if (!items || !Array.isArray(items)) return [{ value: '', label: '-ללא-' }];

    const cleanItems = items.map((opt: any) => {
        const rawVal = opt.value?.["$"] || opt.value || opt.code || "";
        const rawLabel = opt.label?.["$"] || opt.label || opt.displayValue?.["$"] || opt.displayValue || opt.name?.["$"] || opt.name || rawVal;
        return {
            value: typeof rawVal === 'string' ? rawVal.trim() : String(rawVal),
            label: typeof rawLabel === 'string' ? rawLabel.trim() : String(rawLabel)
        };
    }).filter((opt: any) => opt.label !== '-ללא-' && opt.value !== '' && opt.value !== 'None');

    return [{ value: '', label: '-ללא-' }, ...cleanItems];
};

export const DnRouteNumbersFilters = ({ onFilter, onReset, isOpen, setIsOpen }: any) => {
    const { lovs } = useApp();
    const [errors, setErrors] = useState<Record<string, string>>({});

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
        setErrors(prev => {
            const newErr = { ...prev };
            delete newErr[field];
            return newErr;
        });

        let finalValue = value;
        if (field === 'requestId') finalValue = value.toUpperCase();
        if ((field === 'mobileStart' || field === 'mobileEnd') && value !== '' && !/^\d+$/.test(value)) return;
        setFilters(prev => ({ ...prev, [field]: finalValue }));
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (filters.requestId && !filters.requestId.startsWith('NP')) {
            newErrors.requestId = "מזהה בקשה חייב להתחיל ב-NP";
        }

        if (filters.selectByDate === '1') {
            if (!filters.fromDate || !filters.toDate) {
                newErrors.fromDate = "חובה להזין תאריך התחלה וסיום";
                newErrors.toDate = " ";
            }
            else if (new Date(filters.fromDate) > new Date(filters.toDate)) {
                newErrors.fromDate = "תאריך התחלה חייב להיות קטן או שווה לסיום";
                newErrors.toDate = " ";
            }
        }

        if (filters.filterByNum === "SINGLE" && !filters.mobileStart) {
            newErrors.mobileStart = "חובה להזין מספר";
        }
        if (filters.filterByNum === "RANGE") {
            if (!filters.mobileStart) newErrors.mobileStart = "חובה להזין תחילת טווח";
            if (!filters.mobileEnd) newErrors.mobileEnd = "חובה להזין סוף טווח";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const inputClass = (field: string) => `w-[200px] border rounded px-2 py-1 h-7 text-[11px] outline-none transition-all shadow-sm text-right ${errors[field] ? 'border-red-500 bg-red-50 ring-1 ring-red-200' : 'border-slate-300 bg-white text-slate-700 focus:border-blue-500'
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
                                        <FilterRow label={filters.filterByNum === "SINGLE" ? "מספר" : "תחילת טווח"} error={errors.mobileStart}>
                                            <input type="text" className={inputClass('mobileStart')} value={filters.mobileStart} onChange={(e) => handleChange('mobileStart', e.target.value)} />
                                        </FilterRow>
                                        {filters.filterByNum === "RANGE" && (
                                            <FilterRow label="סוף טווח" error={errors.mobileEnd}>
                                                <input type="text" className={inputClass('mobileEnd')} value={filters.mobileEnd} onChange={(e) => handleChange('mobileEnd', e.target.value)} />
                                            </FilterRow>
                                        )}
                                    </>
                                )}
                                <FilterRow label="מזהה בקשה" error={errors.requestId}>
                                    <input type="text" className={inputClass('requestId')} value={filters.requestId} onChange={(e) => handleChange('requestId', e.target.value)} placeholder="...NP" />
                                </FilterRow>

                                <FilterRow label="מפעיל ננטש" error={errors.operatorDonor}>
                                    <select
                                        className={inputClass('operatorDonor')}
                                        value={filters.operatorDonor}
                                        onChange={(e) => handleChange('operatorDonor', e.target.value)}
                                    >
                                        {getCleanOptions(lovs?.['byBusiness']?.item).map((opt: any) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </FilterRow>

                                <FilterRow label="מפעיל קולט" error={errors.operatorRecipient}>
                                    <select
                                        className={inputClass('operatorRecipient')}
                                        value={filters.operatorRecipient}
                                        onChange={(e) => handleChange('operatorRecipient', e.target.value)}
                                    >
                                        {getCleanOptions(lovs?.['byBusiness']?.item).map((opt: any) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </FilterRow>
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
                                        {/* מתאריך */}
                                        <div className="flex items-start gap-3 mb-2">
                                            <label className="text-[11px] font-medium text-slate-600 w-32 text-right shrink-0 mt-1.5">
                                                מתאריך
                                            </label>
                                            <div className="w-[200px]">
                                                <NpgDatePicker
                                                    value={filters.fromDate}
                                                    onChange={(dateString) => setFilters({ ...filters, fromDate: dateString })}
                                                    showTime={true}
                                                    error={errors.fromDate}
                                                />
                                            </div>
                                        </div>

                                        {/* עד תאריך */}
                                        <div className="flex items-start gap-3 mb-2">
                                            <label className="text-[11px] font-medium text-slate-600 w-32 text-right shrink-0 mt-1.5">
                                                עד תאריך
                                            </label>
                                            <div className="w-[200px]">
                                                <NpgDatePicker
                                                    value={filters.toDate}
                                                    onChange={(dateString) => setFilters({ ...filters, toDate: dateString })}
                                                    showTime={true}
                                                    error={errors.toDate}
                                                />
                                            </div>
                                        </div>

                                        {/* כולל היסטוריה בתוך תנאי התאריכים */}
                                        <div className="flex items-center gap-3 h-7 mb-2">
                                            <label className="text-[11px] font-medium text-slate-600 w-32 text-right shrink-0">
                                                כולל היסטוריה
                                            </label>
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 accent-blue-600 cursor-pointer"
                                                checked={filters.includeHistory}
                                                onChange={(e) => handleChange('includeHistory', e.target.checked)}
                                            />
                                        </div>
                                    </>
                                )}

                                <FilterRow label="רשת">
                                    <select
                                        className={inputClass('networkType')}
                                        value={filters.networkType}
                                        onChange={(e) => handleChange('networkType', e.target.value)}
                                    >
                                        {getCleanOptions(lovs?.['byNetwork']?.item).map((opt: any) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </FilterRow>

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
                            <button type="button" onClick={() => { setFilters(initialFilters); setErrors({}); onReset(); }} className="border border-slate-300 bg-slate-50 text-slate-600 px-6 py-1.5 rounded text-xs font-bold hover:bg-slate-100 transition-all">איפוס</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};