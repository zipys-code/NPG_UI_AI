import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, Search, RotateCcw } from 'lucide-react';
import { useApp } from "@/context/AppContext";
import { AutocompleteField } from '../Share/AutocompleteField';

const FilterRow = ({ label, children, error }: { label: string, children: React.ReactNode, error?: string }) => (
    <div className="flex flex-col">
        <div className="flex items-center gap-3 h-8">
            <label className="text-[11px] font-bold text-slate-600 w-28 text-right shrink-0">{label}</label>
            <div className="w-[220px]">{children}</div>
        </div>
        {error && <span className="text-[10px] text-red-500 mr-32 mt-0.5 font-medium leading-none">{error}</span>}
    </div>
);

export const GetMessagesFilters = ({ onFilter, onReset, isOpen, setIsOpen, externalFilters, autoSubmit }: any) => {
    const { lovs } = useApp();

    const today = new Date().toISOString().split('T')[0];
    const pad = (n: number) => n.toString().padStart(2, '0');

    const initialFilters = {
        requestId: '',
        msgType: 'None',
        msgStatus: 'None',
        operator: '', // <-- שדה חדש למפעיל
        dateFrom: today,
        timeFromHour: '00',
        timeFromMin: '00',
        dateTo: today,
        timeToHour: '23',
        timeToMin: '59'
    };

    const [filters, setFilters] = useState(initialFilters);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);

    // --- קליטת נתונים מבחוץ (מהדשבורד) ---
    useEffect(() => {
        if (externalFilters && !hasAutoSubmitted) {
            let merged = { ...initialFilters };

            // הזנת המפעיל
            if (externalFilters.operatorName) {
                merged.operator = externalFilters.operatorName;
            }

            // תרגום פורמט התאריך מהדשבורד (YYYY-MM-DDTHH:mm) לשדות הנפרדים של הטופס
            if (externalFilters.fromDateTime) {
                const [date, time] = externalFilters.fromDateTime.split('T');
                const [hour, min] = time.split(':');
                merged.dateFrom = date;
                merged.timeFromHour = hour;
                merged.timeFromMin = min;
            }
            if (externalFilters.toDateTime) {
                const [date, time] = externalFilters.toDateTime.split('T');
                const [hour, min] = time.split(':');
                merged.dateTo = date;
                merged.timeToHour = hour;
                merged.timeToMin = min;
            }

            setFilters(merged);

            if (autoSubmit) {
                const formatToTibcoDate = (dateStr: string) => {
                    if (!dateStr) return "";
                    const [y, m, d] = dateStr.split("-");
                    return `${d}/${m}/${y}`;
                };

                onFilter({
                    ...merged,
                    dateFrom: formatToTibcoDate(merged.dateFrom),
                    dateTo: formatToTibcoDate(merged.dateTo),
                    timeFrom: `${merged.timeFromHour}:${merged.timeFromMin}`,
                    timeTo: `${merged.timeToHour}:${merged.timeToMin}`
                });
                setHasAutoSubmitted(true);
            }
        }
    }, [externalFilters, autoSubmit, hasAutoSubmitted]);

    const validate = () => {
        const newErrors: Record<string, string> = {};

        // עדכון הלוגיקה: עכשיו מותר לחפש אם יש לפחות אחד מ: בקשה, סוג מסר, או מפעיל
        if (!filters.requestId.trim() && filters.msgType === 'None' && !filters.operator) {
            newErrors.general = "יש להזין מזהה בקשה, לבחור סוג מסר, או לבחור מפעיל";
            newErrors.requestId = " ";
            newErrors.msgType = " ";
        }

        if (filters.requestId && !filters.requestId.toUpperCase().startsWith('NP')) {
            newErrors.requestId = "מזהה בקשה חייב להתחיל ב-NP";
        }

        const fromDateObj = new Date(`${filters.dateFrom}T${filters.timeFromHour}:${filters.timeFromMin}`);
        const toDateObj = new Date(`${filters.dateTo}T${filters.timeToHour}:${filters.timeToMin}`);

        if (fromDateObj > toDateObj) {
            newErrors.dateRange = "תאריך התחלה חייב להיות קטן או שווה לסיום";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const formatToTibcoDate = (dateStr: string) => {
            if (!dateStr) return "";
            const [y, m, d] = dateStr.split("-");
            return `${d}/${m}/${y}`;
        };

        onFilter({
            ...filters,
            dateFrom: formatToTibcoDate(filters.dateFrom),
            dateTo: formatToTibcoDate(filters.dateTo),
            timeFrom: `${filters.timeFromHour}:${filters.timeFromMin}`,
            timeTo: `${filters.timeToHour}:${filters.timeToMin}`
        });
        setIsOpen(false);
    };

    const handleReset = () => {
        setFilters(initialFilters);
        setErrors({});
        onReset();
    };

    const getInputClass = (fieldName: string) => `
        w-full border rounded px-2 py-1 text-[11px] outline-none h-7 transition-all shadow-sm
        ${errors[fieldName] || (fieldName === 'dateFrom' && errors.dateRange) || (fieldName === 'dateTo' && errors.dateRange)
            ? 'border-red-500 bg-red-50 ring-1 ring-red-200'
            : 'border-slate-200 bg-white focus:border-blue-500'}
    `;

    const hours = Array.from({ length: 24 }, (_, i) => pad(i));
    const mins = ["00", "15", "30", "45", "59"];

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div onClick={() => setIsOpen(!isOpen)} className="bg-slate-50 px-4 py-2 flex justify-between items-center cursor-pointer border-b border-slate-200">
                <div className="flex items-center gap-2 text-slate-700 font-bold text-xs">
                    <Search size={14} className="text-blue-600" />
                    <span>סינון נוכחי</span>
                </div>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>

            {isOpen && (
                <form onSubmit={handleSubmit} className="p-4">
                    {errors.general && (
                        <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-xs font-bold text-center">
                            {errors.general}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12 w-fit">
                        {/* עמודה 1 */}
                        <div className="space-y-4">
                            <FilterRow label="מזהה בקשה" error={errors.requestId}>
                                <input
                                    type="text"
                                    className={getInputClass('requestId')}
                                    value={filters.requestId}
                                    onChange={(e) => setFilters({ ...filters, requestId: e.target.value.toUpperCase() })}
                                    placeholder="NP..."
                                />
                            </FilterRow>

                            <FilterRow label="מתאריך" error={errors.dateRange}>
                                <div className="flex gap-1">
                                    <input
                                        type="date"
                                        className={getInputClass('dateFrom')}
                                        value={filters.dateFrom}
                                        onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                                    />
                                    <select className="w-14 border rounded text-[10px] outline-none" value={filters.timeFromHour} onChange={(e) => setFilters({ ...filters, timeFromHour: e.target.value })}>{hours.map(h => <option key={h} value={h}>{h}</option>)}</select>
                                    <select className="w-14 border rounded text-[10px] outline-none" value={filters.timeFromMin} onChange={(e) => setFilters({ ...filters, timeFromMin: e.target.value })}>{mins.map(m => <option key={m} value={m}>{m}</option>)}</select>
                                </div>
                            </FilterRow>

                            <FilterRow label="עד תאריך">
                                <div className="flex gap-1">
                                    <input
                                        type="date"
                                        className={getInputClass('dateTo')}
                                        value={filters.dateTo}
                                        onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                                    />
                                    <select className="w-14 border rounded text-[10px] outline-none" value={filters.timeToHour} onChange={(e) => setFilters({ ...filters, timeToHour: e.target.value })}>{hours.map(h => <option key={h} value={h}>{h}</option>)}</select>
                                    <select className="w-14 border rounded text-[10px] outline-none" value={filters.timeToMin} onChange={(e) => setFilters({ ...filters, timeToMin: e.target.value })}>{mins.map(m => <option key={m} value={m}>{m}</option>)}</select>
                                </div>
                            </FilterRow>
                        </div>

                        {/* עמודה 2 */}
                        <div className="space-y-4">
                            <FilterRow label="סוג מסר" error={errors.msgType}>
                                <div className="w-[400px]">
                                    <AutocompleteField
                                        label=""
                                        options={lovs?.byMessageTypes?.item || []}
                                        value={filters.msgType}
                                        onChange={(v: any) => setFilters({ ...filters, msgType: v })}
                                        placeholder="-בחר סוג מסר-"
                                        hasError={!!errors.msgType}
                                    />
                                </div>
                            </FilterRow>

                            {/* --- הוספנו כאן את שדה המפעיל --- */}
                            <FilterRow label="מפעיל">
                                <div className="w-[220px]">
                                    <AutocompleteField
                                        label=""
                                        options={lovs?.byBusiness?.item || []}
                                        value={filters.operator}
                                        onChange={(v: any) => setFilters({ ...filters, operator: v })}
                                        placeholder="-ללא-"
                                    />
                                </div>
                            </FilterRow>

                            <FilterRow label="סטטוס">
                                <div className="w-[220px]">
                                    <select
                                        className={getInputClass('msgStatus')}
                                        value={filters.msgStatus}
                                        onChange={(e) => setFilters({ ...filters, msgStatus: e.target.value })}
                                    >
                                        <option value="None">-ללא-</option>
                                        <option value="COMPLETED">COMPLETED</option>
                                        <option value="FAILED">FAILED</option>
                                        <option value="REJECTED">REJECTED</option>
                                        <option value="ACCEPTED">ACCEPTED</option>
                                        <option value="SEND">SEND</option>
                                    </select>
                                </div>
                            </FilterRow>
                        </div>
                    </div>

                    <div className="flex justify-start gap-2 mt-6 pt-3 border-t border-slate-100">
                        <button type="submit" className="bg-[#4B9CD3] text-white px-8 py-1.5 rounded text-xs font-bold hover:bg-[#357ABD] shadow-sm transition-colors">בצע חיפוש</button>
                        <button type="button" onClick={handleReset} className="border border-slate-300 bg-slate-50 text-slate-600 px-8 py-1.5 rounded text-xs font-bold hover:bg-slate-100 transition-all">איפוס</button>
                    </div>
                </form>
            )}
        </div>
    );
};