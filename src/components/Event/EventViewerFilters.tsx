import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import { format, subWeeks } from 'date-fns';

export const EventViewerFilters = ({ onFilter, onReset, isOpen, setIsOpen }: any) => {
    const { lovs } = useApp();
    const [errors, setErrors] = useState<Record<string, string>>({});

    const initialFilters = {
        eventId: '',
        requestId: '',
        severity: '',
        eventType: '',
        eventClass: '',
        // שימוש בפורמט YYYY-MM-DD עבור input type="date"
        fromDate: format(subWeeks(new Date(), 1), 'yyyy-MM-dd'),
        toDate: format(new Date(), 'yyyy-MM-dd'),
        fromHour: '00',
        fromMinute: '00',
        toHour: '23',
        toMinute: '59'
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

        // ולידציה של תאריכים
        const fromDateObj = new Date(`${filters.fromDate}T${filters.fromHour}:${filters.fromMinute}`);
        const toDateObj = new Date(`${filters.toDate}T${filters.toHour}:${filters.toMinute}`);

        if (fromDateObj > toDateObj) {
            newErrors.dateRange = "תאריך ושעת התחלה חייבים להיות קטנים או שווים לסיום";
        }

        const hasExtraFilter = filters.eventId || filters.requestId || filters.eventType || filters.eventClass || filters.severity;
        if (!hasExtraFilter) {
            toast.error("יש לבחור לפחות קריטריון אחד לסינון (פרט לתאריך)");
            newErrors.general = "חובה לבחור פילטר נוסף";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (field: string, value: any) => {
        setErrors(prev => ({ ...prev, [field]: '', dateRange: '', general: '' }));
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const inputClass = (field: string) => `
        w-[200px] border rounded px-2 py-1 h-7 text-[11px] outline-none transition-all shadow-sm text-right
        ${(errors[field] || (field === 'fromDate' && errors.dateRange))
            ? 'border-red-500 bg-red-50 ring-1 ring-red-200'
            : 'border-slate-300 bg-white focus:border-blue-500'}
    `;

    const selectClass = "border border-slate-300 rounded text-[11px] h-7 w-14 outline-none focus:border-blue-500";
    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

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
                            <div className="space-y-2">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-3 h-7">
                                        <label className="text-[11px] font-medium text-slate-600 w-32 text-right shrink-0">מספר אירוע</label>
                                        <input type="text" className={inputClass('eventId')} value={filters.eventId} onChange={(e) => handleChange('eventId', e.target.value)} />
                                    </div>
                                    {errors.eventId && <span className="text-[9px] text-red-500 mr-32 mt-0.5 leading-none">{errors.eventId}</span>}
                                </div>

                                <div className="flex flex-col">
                                    <div className="flex items-center gap-3 h-7">
                                        <label className="text-[11px] font-medium text-slate-600 w-32 text-right shrink-0">מזהה בקשה</label>
                                        <input type="text" className={inputClass('requestId')} value={filters.requestId} onChange={(e) => handleChange('requestId', e.target.value)} placeholder="NP..." />
                                    </div>
                                    {errors.requestId && <span className="text-[9px] text-red-500 mr-32 mt-0.5 leading-none">{errors.requestId}</span>}
                                </div>

                                <div className="flex items-center gap-3 h-7">
                                    <label className="text-[11px] font-medium text-slate-600 w-32 text-right shrink-0">סוג אירוע</label>
                                    <select className={inputClass('eventType')} value={filters.eventType} onChange={(e) => handleChange('eventType', e.target.value)}>
                                        <option value="">-ללא-</option>
                                        {lovs?.byEventTypes?.item?.map((opt: any) => (
                                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-3 h-7">
                                    <label className="text-[11px] font-medium text-slate-600 w-32 text-right shrink-0">חומרה</label>
                                    <select className={inputClass('severity')} value={filters.severity} onChange={(e) => handleChange('severity', e.target.value)}>
                                        <option value="">-ללא-</option>
                                        {[1, 2, 3, 4, 5].map(v => <option key={v} value={v.toString()}>{v}</option>)}
                                    </select>
                                </div>

                                <div className="flex flex-col">
                                    <div className="flex items-center gap-3 h-7">
                                        <label className="text-[11px] font-medium text-slate-600 w-32 text-right shrink-0">מתאריך</label>
                                        <div className="flex gap-1 items-center">
                                            {/* החלפה ל-input type="date" */}
                                            <input type="date" className="w-[110px] border border-slate-300 rounded px-2 py-1 h-7 text-[11px] outline-none text-right" value={filters.fromDate} onChange={(e) => handleChange('fromDate', e.target.value)} />
                                            <span className="text-[10px] text-slate-400 px-0.5">שעה:</span>
                                            <select className={selectClass} value={filters.fromHour} onChange={(e) => handleChange('fromHour', e.target.value)}>{hours.map(h => <option key={h} value={h}>{h}</option>)}</select>
                                            <select className={selectClass} value={filters.fromMinute} onChange={(e) => handleChange('fromMinute', e.target.value)}>{minutes.map(m => <option key={m} value={m}>{m}</option>)}</select>
                                        </div>
                                    </div>
                                    {errors.dateRange && <span className="text-[9px] text-red-500 mr-32 mt-0.5 leading-none">{errors.dateRange}</span>}
                                </div>

                                <div className="flex items-center gap-3 h-7">
                                    <label className="text-[11px] font-medium text-slate-600 w-32 text-right shrink-0">עד תאריך</label>
                                    <div className="flex gap-1 items-center">
                                        {/* החלפה ל-input type="date" */}
                                        <input type="date" className="w-[110px] border border-slate-300 rounded px-2 py-1 h-7 text-[11px] outline-none text-right" value={filters.toDate} onChange={(e) => handleChange('toDate', e.target.value)} />
                                        <span className="text-[10px] text-slate-400 px-0.5">שעה:</span>
                                        <select className={selectClass} value={filters.toHour} onChange={(e) => handleChange('toHour', e.target.value)}>{hours.map(h => <option key={h} value={h}>{h}</option>)}</select>
                                        <select className={selectClass} value={filters.toMinute} onChange={(e) => handleChange('toMinute', e.target.value)}>{minutes.map(m => <option key={m} value={m}>{m}</option>)}</select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-start gap-2 mt-6 pt-3 border-t border-slate-100">
                            <button type="submit" className="bg-[#4B9CD3] text-white px-6 py-1.5 rounded text-xs font-bold hover:bg-[#357ABD] transition-colors shadow-sm">חיפוש</button>
                            <button type="button" onClick={() => { setFilters(initialFilters); setErrors({}); onReset(); }} className="border border-slate-300 bg-slate-50 text-slate-600 px-6 py-1.5 rounded text-xs font-bold hover:bg-slate-100 transition-all">איפוס</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};