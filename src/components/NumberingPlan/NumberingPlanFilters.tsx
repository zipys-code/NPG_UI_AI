import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

const FilterRow = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div className="flex items-start gap-3 min-h-[40px]">
        <label className="text-[11px] font-medium text-slate-600 w-32 text-right shrink-0 mt-1.5">{label}</label>
        <div className="w-[200px] flex flex-col">{children}</div>
    </div>
);

export const NumberingPlanFilters = ({ filters, setFilters, onSearch, onReset, isOpen, setIsOpen }: any) => {
    const { lovs } = useApp();
    const [errors, setErrors] = useState<any>({});

    const handleChange = (field: string, value: any) => {
        setFilters((prev: any) => ({ ...prev, [field]: value }));
        // ניקוי שגיאה ברגע שמתחילים להקליד
        if (errors[field]) {
            setErrors((prev: any) => {
                const newErrs = { ...prev };
                delete newErrs[field];
                return newErrs;
            });
        }
    };

    // בתוך NumberingPlanFilters.tsx

    const validate = () => {
        const newErrors: any = {};
        const phoneRegex = /^[0-9]*$/;

        // 1. ולידציה למספר בודד
        if (filters.numberFilterType === 'Single') {
            if (!filters.dnNumber) newErrors.dnNumber = "שדה חובה";
            else if (!phoneRegex.test(filters.dnNumber)) newErrors.dnNumber = "ספרות בלבד";
        }

        // 2. ולידציה לטווח מספרים
        if (filters.numberFilterType === 'Range') {
            // בדיקת שדות חובה ופורמט ספרות
            if (!filters.fromNumber) newErrors.fromNumber = "שדה חובה";
            else if (!phoneRegex.test(filters.fromNumber)) newErrors.fromNumber = "ספרות בלבד";

            if (!filters.toNumber) newErrors.toNumber = "שדה חובה";
            else if (!phoneRegex.test(filters.toNumber)) newErrors.toNumber = "ספרות בלבד";

            // הבדיקה שהוספנו: השוואת ערכים (רק אם שניהם תקינים מבחינת פורמט)
            if (!newErrors.fromNumber && !newErrors.toNumber) {
                const startNum = BigInt(filters.fromNumber);
                const endNum = BigInt(filters.toNumber);

                if (startNum > endNum) {
                    newErrors.toNumber = "סוף הטווח חייב להיות גדול מההתחלה";
                }
            }
        }

        // 3. ולידציה לתאריכים (קיים)
        if (filters.validity === 'History') {
            if (new Date(filters.dateFrom) > new Date(filters.dateTo)) {
                newErrors.dateTo = "תאריך סיום חייב להיות אחרי התחלה";
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
                                        <FilterRow label="מתאריך">
                                            <input type="date" className={getFieldClass('dateFrom')} value={filters.dateFrom} onChange={(e) => handleChange('dateFrom', e.target.value)} />
                                        </FilterRow>
                                        <FilterRow label="עד תאריך">
                                            <input type="date" className={getFieldClass('dateTo')} value={filters.dateTo} onChange={(e) => handleChange('dateTo', e.target.value)} />
                                            {errors.dateTo && <span className="text-[9px] text-red-600 font-bold mt-0.5">{errors.dateTo}</span>}
                                        </FilterRow>
                                    </>
                                )}

                                <FilterRow label="סינון לפי מפעיל">
                                    {/* סינון לפי מפעיל */}
                                    <select className={getFieldClass('operator')} value={filters.operator} onChange={(e) => handleChange('operator', e.target.value)}>
                                        <option value="">-ללא-</option>
                                        {(lovs?.byBusiness?.item || []).map((opt: any, idx: number) => {
                                            // 1. שליפת הערך (הקוד לשליחה לשרת)
                                            const val = opt.value?.["$"] || opt.value || opt.code || "";

                                            // 2. שליפת השם לתצוגה - בדיקה של כל הווריאציות האפשריות ב-TIBCO
                                            const label = opt.label?.["$"] || opt.label ||
                                                opt.displayValue?.["$"] || opt.displayValue ||
                                                opt.name?.["$"] || opt.name || val;

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
                                    <FilterRow label="מספר">
                                        <input type="text" className={getFieldClass('dnNumber')} value={filters.dnNumber} onChange={(e) => handleChange('dnNumber', e.target.value)} />
                                        {errors.dnNumber && <span className="text-[9px] text-red-600 font-bold mt-0.5">{errors.dnNumber}</span>}
                                    </FilterRow>
                                )}

                                {filters.numberFilterType === 'Range' && (
                                    <>
                                        <FilterRow label="תחילת טווח">
                                            <input type="text" className={getFieldClass('fromNumber')} value={filters.fromNumber} onChange={(e) => handleChange('fromNumber', e.target.value)} />
                                            {errors.fromNumber && <span className="text-[9px] text-red-600 font-bold mt-0.5">{errors.fromNumber}</span>}
                                        </FilterRow>
                                        <FilterRow label="סוף טווח">
                                            <input type="text" className={getFieldClass('toNumber')} value={filters.toNumber} onChange={(e) => handleChange('toNumber', e.target.value)} />
                                            {errors.toNumber && <span className="text-[9px] text-red-600 font-bold mt-0.5">{errors.toNumber}</span>}
                                        </FilterRow>
                                    </>
                                )}

                                <FilterRow label="סינון לפי רשת">
                                    {/* סינון לפי רשת */}
                                    <select className={getFieldClass('network')} value={filters.network} onChange={(e) => handleChange('network', e.target.value)}>
                                        <option value="">-ללא-</option>
                                        {(lovs?.byNetwork?.item || []).map((opt: any, idx: number) => {
                                            const val = opt.value?.["$"] || opt.value || opt.code || "";

                                            const label = opt.label?.["$"] || opt.label ||
                                                opt.displayValue?.["$"] || opt.displayValue ||
                                                opt.name?.["$"] || opt.name || val;

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
                                    setErrors({}); // ניקוי שגיאות אדומות
                                    onReset();    // קריאה לפונקציית האיפוס שמעדכנת את ה-filters
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