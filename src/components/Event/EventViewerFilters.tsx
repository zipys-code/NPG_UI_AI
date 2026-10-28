import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useApp } from "@/context/AppContext";
import { format, subWeeks } from 'date-fns';
import { NpgDatePicker } from '../Share/NpgDatePicker';

const FilterRow = ({ label, children, error }: { label: string, children: React.ReactNode, error?: string }) => (
    <div className="flex flex-col mb-2">
        <div className="flex items-start gap-3 min-h-[32px]">
            <label className="text-[11px] font-bold text-slate-600 w-28 text-right shrink-0 mt-1.5">{label}</label>
            <div className="w-[220px]">
                {children}
            </div>
        </div>
        {error && error !== " " && (
            <span className="text-[10px] text-red-600 font-semibold pr-[124px] mt-[-2px]">{error}</span>
        )}
    </div>
);

export const EventViewerFilters = ({ onFilter, onReset, isOpen, setIsOpen }: any) => {
    const { lovs } = useApp();
    const [errors, setErrors] = useState<Record<string, string>>({});

    const initialFilters = {
        eventId: '',
        requestId: '',
        severity: '',
        eventType: '',
        eventClass: '',
        // התאריך והשעה אוחדו למחרוזת אחת
        fromDate: format(subWeeks(new Date(), 1), 'yyyy-MM-dd') + 'T00:00',
        toDate: format(new Date(), 'yyyy-MM-dd') + 'T23:59',
    };

    const [filters, setFilters] = useState(initialFilters);

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (filters.eventId && !/^\d+$/.test(filters.eventId)) {
            newErrors.eventId = "יש להזין מספרים בלבד";
        }

        if (filters.requestId && !filters.requestId.toUpperCase().startsWith('NP')) {
            newErrors.requestId = "מזהה בקשה חייב להתחיל ב-NP";
        }

        const fromDateObj = new Date(filters.fromDate.replace(' ', 'T'));
        const toDateObj = new Date(filters.toDate.replace(' ', 'T'));

        if (fromDateObj > toDateObj) {
            newErrors.fromDate = "תאריך ושעת התחלה חייבים להיות קטנים או שווים לסיום";
            newErrors.toDate = " ";
        }

        const hasExtraFilter = filters.eventId || filters.requestId || filters.eventType || filters.eventClass || filters.severity;
        if (!hasExtraFilter) {
            // במקום toast, אנחנו שומרים שגיאה כללית שתופיע מעל הכפתורים
            newErrors.general = "יש לבחור לפחות קריטריון אחד לסינון (פרט לתאריכים)";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (field: string, value: any) => {
        setErrors(prev => {
            const newErr = { ...prev };
            delete newErr[field];
            delete newErr.general; // מנקה את השגיאה הכללית ברגע שבוחרים משהו
            if (field === 'fromDate' || field === 'toDate') {
                delete newErr.fromDate;
                delete newErr.toDate;
            }
            return newErr;
        });
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const inputClass = (field: string) => `w-[200px] border rounded px-2 py-1 h-7 text-[11px] outline-none transition-all shadow-sm text-right ${errors[field] ? 'border-red-500 bg-red-50 ring-1 ring-red-200' : 'border-slate-300 bg-white focus:border-blue-500'}`;

    return (
        <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 mb-4 overflow-hidden" dir="rtl">
            <div className="flex items-center justify-start gap-2 p-2.5 px-4 cursor-pointer hover:bg-slate-50 bg-slate-50/30" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <ChevronUp size={14} className="text-blue-600" /> : <ChevronDown size={14} className="text-blue-600" />}
                <span className="text-[12px] font-bold text-blue-700">סינון נוכחי</span>
            </div>

            {isOpen && (
                <div className="p-4 px-6">
                    <form onSubmit={(e) => { e.preventDefault(); if (validate()) onFilter(filters); }}>
                        <div className="grid grid-cols-2 gap-x-12 gap-y-2 w-fit">
                            <div className="space-y-1">
                                <FilterRow label="מספר אירוע" error={errors.eventId}>
                                    <input type="text" className={inputClass('eventId')} value={filters.eventId} onChange={(e) => handleChange('eventId', e.target.value)} />
                                </FilterRow>

                                <FilterRow label="מזהה בקשה" error={errors.requestId}>
                                    <input type="text" className={inputClass('requestId')} value={filters.requestId} onChange={(e) => handleChange('requestId', e.target.value)} placeholder="NP..." />
                                </FilterRow>

                                <FilterRow label="סוג אירוע">
                                    <select className={inputClass('eventType')} value={filters.eventType} onChange={(e) => handleChange('eventType', e.target.value)}>
                                        <option value="">-ללא-</option>
                                        {(lovs?.byEventTypes?.item || [])
                                            .filter((opt: any) => opt.label !== '-ללא-' && opt.value !== '')
                                            .map((opt: any) => (
                                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                                            ))}
                                    </select>
                                </FilterRow>

                                <FilterRow label="סיווג אירוע">
                                    <select className={inputClass('eventClass')} value={filters.eventClass} onChange={(e) => handleChange('eventClass', e.target.value)}>
                                        <option value="">-ללא-</option>
                                        <option value="NOTIFICATION">NOTIFICATION</option>
                                        <option value="ALERT">ALERT</option>
                                    </select>
                                </FilterRow>
                            </div>

                            <div className="space-y-1">
                                <FilterRow label="חומרה">
                                    <select className={inputClass('severity')} value={filters.severity} onChange={(e) => handleChange('severity', e.target.value)}>
                                        <option value="">-ללא-</option>
                                        {[1, 2, 3, 4, 5].map(v => <option key={v} value={v.toString()}>{v}</option>)}
                                    </select>
                                </FilterRow>

                                <FilterRow label="מתאריך" >
                                    <NpgDatePicker
                                        value={filters.fromDate}
                                        onChange={(val) => handleChange('fromDate', val)}
                                        showTime={true}
                                        error={errors.fromDate}
                                    />
                                </FilterRow>

                                <FilterRow label="עד תאריך" >
                                    <NpgDatePicker
                                        value={filters.toDate}
                                        onChange={(val) => handleChange('toDate', val)}
                                        showTime={true}
                                        error={errors.toDate}
                                    />
                                </FilterRow>
                            </div>
                        </div>

                        {/* תצוגת שגיאה כללית (למשל: לא בחרת פילטר חובה) */}
                        {errors.general && (
                            <div className="mt-4 text-[11px] font-bold text-red-600 bg-red-50 p-2 rounded border border-red-100 w-fit">
                                {errors.general}
                            </div>
                        )}

                        <div className="flex justify-start gap-2 mt-4 pt-3 border-t border-slate-100">
                            <button type="submit" className="bg-[#4B9CD3] text-white px-6 py-1.5 rounded text-xs font-bold hover:bg-[#357ABD] transition-colors shadow-sm">חיפוש</button>
                            <button type="button" onClick={() => { setFilters(initialFilters); setErrors({}); onReset(); }} className="border border-slate-300 bg-slate-50 text-slate-600 px-6 py-1.5 rounded text-xs font-bold hover:bg-slate-100 transition-all">איפוס</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};