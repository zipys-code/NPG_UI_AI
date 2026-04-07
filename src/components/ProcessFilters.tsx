import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, RotateCcw, ChevronUp, ChevronDown } from 'lucide-react';
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

// פונקציית עזר להגדרת תאריכי היום (00:00 עד 23:59) בפורמט datetime-local
const getTodayBounds = (type: 'start' | 'end') => {
    const date = new Date();
    if (type === 'start') {
        date.setHours(0, 0, 0, 0);
    } else {
        date.setHours(23, 59, 59, 999);
    }

    const pad = (n: number) => n.toString().padStart(2, '0');
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());

    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

const AutocompleteField = ({
    label, options, value, onChange, placeholder = "-בחר-", hasError = false
}: {
    label: string, options: { value: string, label: string }[], value: string, onChange: (val: string) => void, placeholder?: string, hasError?: boolean
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);
    const currentLabel = options.find(opt => opt.value === value)?.label || '';

    const filteredOptions = useMemo(() => {
        if (!searchTerm) return options;
        return options.filter(opt =>
            opt.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
            opt.value.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [options, searchTerm]);

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
                    <div className="absolute top-full right-0 left-0 z-[100] mt-1 max-h-40 overflow-y-auto rounded border border-slate-200 bg-white shadow-lg">
                        <div className="px-2 py-1 text-[11px] hover:bg-blue-50 cursor-pointer text-slate-400 text-right" onClick={() => { onChange(''); setIsOpen(false); }}>-ללא-</div>
                        {filteredOptions.map(opt => (
                            <div key={opt.value} className="px-2 py-1 text-[11px] hover:bg-blue-50 cursor-pointer text-slate-700 text-right border-b border-slate-50 last:border-0"
                                onClick={() => { onChange(opt.value); setIsOpen(false); setSearchTerm(''); }}>
                                {opt.label}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

interface ProcessFiltersProps {
    onFilter: (filters: any) => void;
    onReset: () => void;
}

export const ProcessFilters: React.FC<ProcessFiltersProps> = ({ onFilter, onReset }) => {
    const { lovs } = useApp();
    const [isOpen, setIsOpen] = useState(true);
    const [errors, setErrors] = useState<string[]>([]);

    const initialFilters = {
        requestId: '',
        processId: '',
        groupId: '',
        customerId: '',
        fromDateTime: getTodayBounds('start'),
        toDateTime: getTodayBounds('end'),
        mobileAband: '',
        mobileRec: '',
        mobileStart: '',
        mobileRecEnd: '',
        filterByNum: '',
        filterByOp: '',
        filterByNet: '',
        processType: '',
        processStatus: '',
        processStep: '',
        customerProfile: ''
    };

    const [filters, setFilters] = useState(initialFilters);

    const getOptionsFromLOV = (categoryKey: string) => {
        const group = lovs?.[categoryKey];
        const items = group?.item;
        if (!items || !Array.isArray(items)) return [];
        return items;
    };

    const options = useMemo(() => ({
        processTypes: getOptionsFromLOV('byProcessType'),
        statuses: getOptionsFromLOV('byStatus'),
        stages: getOptionsFromLOV('byState'),
        operators: getOptionsFromLOV('byBusiness'),
        networks: getOptionsFromLOV('byNetwork'),
        customerProfiles: getOptionsFromLOV('byCustomerProfile'),
    }), [lovs]);

    const handleChange = (field: string, value: string) => {
        if (errors.includes(field)) {
            setErrors(prev => prev.filter(err => err !== field));
        }
        const finalValue = field === 'requestId' ? value.toUpperCase() : value;
        setFilters(prev => ({ ...prev, [field]: finalValue }));
    };

    const handleNumberOnlyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        const allowedKeys = ['Backspace', 'Tab', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
        if (!/[0-9]/.test(e.key) && !allowedKeys.includes(e.key)) {
            e.preventDefault();
        }
    };

    const validate = () => {
        const newErrors: string[] = [];
        const isDigitsOnly = (val: string) => /^\d+$/.test(val);
        const isIsraeliPhone = (val: string) => /^(05\d{8}|0[23489]\d{7})$/.test(val);

        // 1. תאריכים
        if (new Date(filters.fromDateTime) > new Date(filters.toDateTime)) {
            newErrors.push('fromDateTime', 'toDateTime');
            toast.error("תאריך התחלה חייב להיות מוקדם מתאריך סיום");
        }

        // 2. מזהה בקשה
        if (filters.requestId && !/^NP[A-Z0-9]+$/.test(filters.requestId)) {
            newErrors.push('requestId');
            toast.error("מזהה בקשה חייב להתחיל ב-NP");
        }

        // 3. מספרים מובילים
        if (filters.mobileAband && !isDigitsOnly(filters.mobileAband)) newErrors.push('mobileAband');
        if (filters.mobileRec && !isDigitsOnly(filters.mobileRec)) newErrors.push('mobileRec');

        // 4. סינון לפי מספר/טווח
        if (filters.filterByNum === "SINGLE") {
            if (!filters.mobileStart || !isIsraeliPhone(filters.mobileStart)) {
                newErrors.push('mobileStart');
                toast.error("נא להזין מספר טלפון תקין");
            }
        }

        if (filters.filterByNum === "RANGE") {
            let hasFormatError = false;
            if (!filters.mobileStart || !isIsraeliPhone(filters.mobileStart)) {
                newErrors.push('mobileStart');
                hasFormatError = true;
            }
            if (!filters.mobileRecEnd || !isIsraeliPhone(filters.mobileRecEnd)) {
                newErrors.push('mobileRecEnd');
                hasFormatError = true;
            }

            if (!hasFormatError && Number(filters.mobileStart) >= Number(filters.mobileRecEnd)) {
                newErrors.push('mobileStart', 'mobileRecEnd');
                toast.error("תחילת הטווח חייבת להיות קטנה מסוף הטווח");
            } else if (hasFormatError) {
                toast.error("שדות הטווח חייבים להכיל מספרי טלפון תקינים");
            }
        }

        setErrors(newErrors);
        return newErrors.length === 0;
    };

    const handleResetClick = () => {
        setErrors([]);
        setFilters(initialFilters);
        onReset();
    };

    const getInputClass = (fieldName: string) => {
        const base = "w-[200px] rounded border px-2 py-1 text-[12px] outline-none h-7 shadow-sm text-right transition-all";
        return errors.includes(fieldName)
            ? `${base} border-red-500 bg-red-50 ring-1 ring-red-200`
            : `${base} border-slate-300 bg-white text-slate-700 focus:border-blue-500`;
    };

    return (
        <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 mb-4 overflow-hidden" dir="rtl">
            <div className="flex items-center justify-start gap-2 p-2.5 px-4 cursor-pointer hover:bg-slate-50 bg-slate-50/30" onClick={() => setIsOpen(!isOpen)}>
                {isOpen ? <ChevronUp size={14} className="text-blue-600" /> : <ChevronDown size={14} className="text-blue-600" />}
                <span className="text-[12px] font-bold text-blue-700 select-none">סינון נוכחי</span>
            </div>

            {isOpen && (
                <div className="p-4">
                    <form onSubmit={(e) => { e.preventDefault(); if (validate()) onFilter(filters); }}>
                        <div className="grid grid-cols-2 gap-x-12 gap-y-2 w-fit">
                            <div className="space-y-2">
                                <FilterRow label="מזהה בקשה">
                                    <input type="text" className={getInputClass('requestId')} value={filters.requestId} onChange={(e) => handleChange('requestId', e.target.value)} placeholder="NP..." />
                                </FilterRow>
                                <FilterRow label="מספר תהליך">
                                    <input type="text" className={getInputClass('processId')} value={filters.processId} onChange={(e) => handleChange('processId', e.target.value)} />
                                </FilterRow>
                                <FilterRow label="מספר קבוצה">
                                    <input type="text" className={getInputClass('groupId')} value={filters.groupId} onChange={(e) => handleChange('groupId', e.target.value)} />
                                </FilterRow>
                                <FilterRow label="מזהה לקוח">
                                    <input type="text" className={getInputClass('customerId')} value={filters.customerId} onChange={(e) => handleChange('customerId', e.target.value)} />
                                </FilterRow>
                                <FilterRow label="מתאריך">
                                    <input type="datetime-local" className={getInputClass('fromDateTime')} value={filters.fromDateTime} onChange={(e) => handleChange('fromDateTime', e.target.value)} />
                                </FilterRow>
                                <FilterRow label="עד תאריך">
                                    <input type="datetime-local" className={getInputClass('toDateTime')} value={filters.toDateTime} onChange={(e) => handleChange('toDateTime', e.target.value)} />
                                </FilterRow>
                                <FilterRow label="מספר מוביל - ננטש">
                                    <input type="text" className={getInputClass('mobileAband')} value={filters.mobileAband} onKeyDown={handleNumberOnlyKeyDown} onChange={(e) => handleChange('mobileAband', e.target.value)} />
                                </FilterRow>
                                <FilterRow label="מספר מוביל - קולט">
                                    <input type="text" className={getInputClass('mobileRec')} value={filters.mobileRec} onKeyDown={handleNumberOnlyKeyDown} onChange={(e) => handleChange('mobileRec', e.target.value)} />
                                </FilterRow>
                            </div>

                            <div className="space-y-2">
                                <FilterRow label="סנן לפי מספר">
                                    <select className={getInputClass('filterByNum')} value={filters.filterByNum} onChange={(e) => handleChange('filterByNum', e.target.value)}>
                                        <option value="">-ללא-</option>
                                        <option value="SINGLE">לפי מספר</option>
                                        <option value="RANGE">לפי טווח מספרים</option>
                                    </select>
                                </FilterRow>

                                {filters.filterByNum && (
                                    <>
                                        <FilterRow label={filters.filterByNum === "SINGLE" ? "מספר" : "תחילת טווח"}>
                                            <input type="text" className={getInputClass('mobileStart')} value={filters.mobileStart} onKeyDown={handleNumberOnlyKeyDown} onChange={(e) => handleChange('mobileStart', e.target.value)} />
                                        </FilterRow>
                                        {filters.filterByNum === "RANGE" && (
                                            <FilterRow label="סוף טווח">
                                                <input type="text" className={getInputClass('mobileRecEnd')} value={filters.mobileRecEnd} onKeyDown={handleNumberOnlyKeyDown} onChange={(e) => handleChange('mobileRecEnd', e.target.value)} />
                                            </FilterRow>
                                        )}
                                    </>
                                )}
                                <AutocompleteField label="סינון לפי מפעיל" options={options.operators} value={filters.filterByOp} onChange={(v) => handleChange('filterByOp', v)} hasError={errors.includes('filterByOp')} />
                                <AutocompleteField label="סינון לפי רשת" options={options.networks} value={filters.filterByNet} onChange={(v) => handleChange('filterByNet', v)} hasError={errors.includes('filterByNet')} />
                                <FilterRow label="סוג תהליך">
                                    <select className={getInputClass('processType')} value={filters.processType} onChange={(e) => handleChange('processType', e.target.value)}>
                                        <option value="">-ללא-</option>
                                        {options.processTypes.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </FilterRow>
                                <AutocompleteField label="סינון לפי מצב" options={options.statuses} value={filters.processStatus} onChange={(v) => handleChange('processStatus', v)} hasError={errors.includes('processStatus')} />
                                <AutocompleteField label="סינון לפי שלב" options={options.stages} value={filters.processStep} onChange={(v) => handleChange('processStep', v)} hasError={errors.includes('processStep')} />
                                <FilterRow label="פרופיל לקוח">
                                    <select className={getInputClass('customerProfile')} value={filters.customerProfile} onChange={(e) => handleChange('customerProfile', e.target.value)}>
                                        <option value="">-ללא-</option>
                                        {options.customerProfiles.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </FilterRow>
                            </div>
                        </div>
                        <div className="flex justify-start gap-2 mt-6 pt-3 border-t border-slate-100">
                            <button type="submit" className="bg-[#4B9CD3] text-white px-6 py-1.5 rounded text-xs font-bold hover:bg-[#357ABD]">בצע חיפוש</button>
                            <button type="button" onClick={handleResetClick} className="border border-slate-300 bg-slate-50 text-slate-600 px-6 py-1.5 rounded text-xs font-bold">איפוס</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

const FilterRow = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div className="flex items-center gap-3 h-7">
        <label className="text-[11px] font-medium text-slate-600 w-32 text-right shrink-0">{label}</label>
        <div className="w-[200px]">{children}</div>
    </div>
);