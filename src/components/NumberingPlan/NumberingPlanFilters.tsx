import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import { NpgDatePicker } from '../Share/NpgDatePicker';

// עדכנו את FilterRow כך שיתמוך בשגיאות
const FilterRow = ({ label, error, children }: { label: string, error?: string, children: React.ReactNode }) => (
    <div className="flex items-start gap-3 min-h-[40px]">
        <label className="text-[11px] font-medium text-slate-600 w-32 text-right shrink-0 mt-1.5">{label}</label>
        <div className="w-[200px] flex flex-col gap-1">
            {children}
            {error && error !== " " && (
                <span className="text-[10px] text-red-600 font-semibold pr-1 mt-[-2px]">{error}</span>
            )}
        </div>
    </div>
);

export const NumberingPlanFilters = ({ filters, setFilters, onSearch, onReset, isOpen, setIsOpen }: any) => {
    const { lovs } = useApp();
    const [errors, setErrors] = useState<any>({});

    const handleChange = (field: string, value: any) => {
        setFilters((prev: any) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev: any) => {
                const newErrs = { ...prev };
                delete newErrs[field];
                return newErrs;
            });
        }
    };

    const validate = () => {
        const newErrors: any = {};
        const phoneRegex = /^[0-9]*$/;

        if (filters.numberFilterType === 'Single') {
            if (!filters.dnNumber) newErrors.dnNumber = "שדה חובה";
            else if (!phoneRegex.test(filters.dnNumber)) newErrors.dnNumber = "ספרות בלבד";
        }

        if (filters.numberFilterType === 'Range') {
            if (!filters.fromNumber) newErrors.fromNumber = "שדה חובה";
            else if (!phoneRegex.test(filters.fromNumber)) newErrors.fromNumber = "ספרות בלבד";

            if (!filters.toNumber) newErrors.toNumber = "שדה חובה";
            else if (!phoneRegex.test(filters.toNumber)) newErrors.toNumber = "ספרות בלבד";

            if (!newErrors.fromNumber && !newErrors.toNumber) {
                const startNum = BigInt(filters.fromNumber);
                const endNum = BigInt(filters.toNumber);
                if (startNum > endNum) {
                    newErrors.toNumber = "סוף הטווח חייב להיות גדול מההתחלה";
                }
            }
        }

        if (filters.validity === 'History') {
            if (!filters.dateFrom || !filters.dateTo) {
                if (!filters.dateFrom) newErrors.dateFrom = "שדה חובה";
                if (!filters.dateTo) newErrors.dateTo = "שדה חובה";
            } else if (new Date(filters.dateFrom) > new Date(filters.dateTo)) {
                newErrors.dateFrom = "תאריך סיום חייב להיות אחרי התחלה";
                newErrors.dateTo = " ";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const getFieldClass = (fieldName: string) => {
        const base = "h-7 w-[200px] border rounded px-2 text-[11px] outline-none transition-all shadow-sm text-right";
        return errors[fieldName]
            ? `${base} border-red-500 bg-red-50 focus:ring-1 focus:ring-red-200`
            : `${base} border-slate-300 bg-white focus:border-blue-500`;
    };

    return (
        <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 mb-4 overflow-hidden" dir="rtl">
            <div className="flex items-center justify-start gap-2 p-2.5 px-4 cursor-pointer hover:bg-slate-50 bg-slate-50/30"
                onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <ChevronUp size={14} className="text-blue-600" /> : <ChevronDown size={14} className="text-blue-600" />}
                <span className="text-[12px] font-bold text-blue-700">סינון נוכחי</span>
            </div>

            {isOpen && (
                <div className="p-4">
                    <form onSubmit={(e) => { e.preventDefault(); if (validate()) onSearch(); else toast.error("תקני שגיאות בטופס"); }}>
                        <div className="grid grid-cols-2 gap-x-12 gap-y-1 w-fit">
                            <div className="space-y-1">
                                <FilterRow label="סינון לפי תוקף">
                                    <select className={getFieldClass('validity')} value={filters.validity} onChange={(e) => handleChange('validity', e.target.value)}>
                                        <option value="Active">ערכים פעילים בלבד</option>
                                        <option value="History">כל הרשומות</option>
                                    </select>
                                </FilterRow>

                                {filters.validity === 'History' && (
                                    <>
                                        {/* NpgDatePicker מטפל בעצמו בשגיאה, לכן לא מעבירים ל-FilterRow */}
                                        <FilterRow label="מתאריך">
                                            <NpgDatePicker
                                                value={filters.dateFrom}
                                                onChange={(v) => handleChange('dateFrom', v)}
                                                error={errors.dateFrom}
                                            />
                                        </FilterRow>
                                        <FilterRow label="עד תאריך">
                                            <NpgDatePicker
                                                value={filters.dateTo}
                                                onChange={(v) => handleChange('dateTo', v)}
                                                error={errors.dateTo}
                                            />
                                        </FilterRow>
                                    </>
                                )}

                                <FilterRow label="סינון לפי מפעיל">
                                    <select className={getFieldClass('operator')} value={filters.operator} onChange={(e) => handleChange('operator', e.target.value)}>
                                        <option value="">-ללא-</option>
                                        {(lovs?.byBusiness?.item || [])
                                            .filter((opt: any) => {
                                                const val = opt.value?.["$"] || opt.value || opt.code || "";
                                                const label = opt.label?.["$"] || opt.label || opt.displayValue?.["$"] || opt.displayValue || opt.name?.["$"] || opt.name || val;
                                                return label !== '-ללא-' && val !== '';
                                            })
                                            .map((opt: any, idx: number) => {
                                                const val = opt.value?.["$"] || opt.value || opt.code || "";
                                                const label = opt.label?.["$"] || opt.label || opt.displayValue?.["$"] || opt.displayValue || opt.name?.["$"] || opt.name || val;
                                                return (
                                                    <option key={`${val}-${idx}`} value={val}>
                                                        {label}
                                                    </option>
                                                );
                                            })}
                                    </select>
                                </FilterRow>

                                <FilterRow label="סוג קו">
                                    <select className={getFieldClass('tollFree')} value={filters.tollFree} onChange={(e) => handleChange('tollFree', e.target.value)}>
                                        <option value="0">-ללא-</option>
                                        <option value="true">שיחות חינם</option>
                                        <option value="false">שיחות בתשלום</option>
                                    </select>
                                </FilterRow>
                            </div>

                            <div className="space-y-1">
                                <FilterRow label="סנן לפי מספר">
                                    <select className={getFieldClass('numberFilterType')} value={filters.numberFilterType} onChange={(e) => handleChange('numberFilterType', e.target.value)}>
                                        <option value="0">-ללא-</option>
                                        <option value="Single">לפי מספר</option>
                                        <option value="Range">לפי טווח מספרים</option>
                                    </select>
                                </FilterRow>

                                {filters.numberFilterType === 'Single' && (
                                    <FilterRow label="מספר" error={errors.dnNumber}>
                                        <input type="text" className={getFieldClass('dnNumber')} value={filters.dnNumber} onChange={(e) => handleChange('dnNumber', e.target.value)} />
                                    </FilterRow>
                                )}

                                {filters.numberFilterType === 'Range' && (
                                    <>
                                        <FilterRow label="תחילת טווח" error={errors.fromNumber}>
                                            <input type="text" className={getFieldClass('fromNumber')} value={filters.fromNumber} onChange={(e) => handleChange('fromNumber', e.target.value)} />
                                        </FilterRow>
                                        <FilterRow label="סוף טווח" error={errors.toNumber}>
                                            <input type="text" className={getFieldClass('toNumber')} value={filters.toNumber} onChange={(e) => handleChange('toNumber', e.target.value)} />
                                        </FilterRow>
                                    </>
                                )}

                                <FilterRow label="סינון לפי רשת">
                                    <select className={getFieldClass('network')} value={filters.network} onChange={(e) => handleChange('network', e.target.value)}>
                                        <option value="">-ללא-</option>
                                        {(lovs?.byNetwork?.item || [])
                                            .filter((opt: any) => {
                                                const val = opt.value?.["$"] || opt.value || opt.code || "";
                                                const label = opt.label?.["$"] || opt.label || opt.displayValue?.["$"] || opt.displayValue || opt.name?.["$"] || opt.name || val;
                                                return label !== '-ללא-' && val !== '';
                                            })
                                            .map((opt: any, idx: number) => {
                                                const val = opt.value?.["$"] || opt.value || opt.code || "";
                                                const label = opt.label?.["$"] || opt.label || opt.displayValue?.["$"] || opt.displayValue || opt.name?.["$"] || opt.name || val;
                                                return (
                                                    <option key={`${val}-${idx}`} value={val}>
                                                        {label}
                                                    </option>
                                                );
                                            })}
                                    </select>
                                </FilterRow>

                                <FilterRow label="מספר כשר">
                                    <select className={getFieldClass('kosherFilter')} value={filters.kosherFilter} onChange={(e) => handleChange('kosherFilter', e.target.value)}>
                                        <option value="0">-ללא-</option>
                                        <option value="true">כשר</option>
                                        <option value="false">לא כשר</option>
                                    </select>
                                </FilterRow>
                            </div>
                        </div>

                        <div className="flex justify-start gap-2 mt-4 pt-3 border-t border-slate-100">
                            <button type="submit" className="bg-[#4B9CD3] text-white px-6 py-1.5 rounded text-xs font-bold hover:bg-[#357ABD] shadow-sm">
                                בצע חיפוש
                            </button>
                            <button type="button"
                                onClick={() => {
                                    setErrors({});
                                    onReset();
                                }}
                                className="border border-slate-300 bg-slate-50 text-slate-600 px-6 py-1.5 rounded text-xs font-bold hover:bg-slate-100">
                                איפוס
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};