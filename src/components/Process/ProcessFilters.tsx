import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, RotateCcw, ChevronUp, ChevronDown } from 'lucide-react';
import { useApp } from "@/context/AppContext";
import { NpgDatePicker } from '../Share/NpgDatePicker';

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

const FilterRow = ({ label, error, children }: { label: string, error?: string, children: React.ReactNode }) => (
    <div className="flex flex-col mb-2">
        <div className="flex items-start gap-3 min-h-[32px]">
            <label className="text-[11px] font-medium text-slate-600 w-32 text-right shrink-0 mt-1.5">{label}</label>
            <div className="w-[200px] flex flex-col">
                {children}
            </div>
        </div>
        {error && error !== " " && (
            <span className="text-[10px] text-red-600 font-semibold pr-[140px] mt-[-2px]">{error}</span>
        )}
    </div>
);

// Autocomplete חכם יותר - בלי placeholder, רק מציג את מה שיש ברשימה
const AutocompleteField = ({
    label, options, value, onChange, hasError = false
}: {
    label: string, options: { value: string, label: string }[], value: string, onChange: (val: string) => void, hasError?: boolean
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    // מזהה תמיד את התווית (אם זה מחרוזת ריקה, הוא ימצא את ה "-ללא-")
    const currentLabel = options.find(opt => opt.value === value)?.label || '-ללא-';

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
        <FilterRow label={label} error={hasError ? " " : undefined}>
            <div className="relative" ref={wrapperRef}>
                <input
                    type="text"
                    // --- השינויים שלנו כאן: text-slate-700 לצבע, ו-pr-1 להיצמדות לימין ---
                    className={`w-full rounded border pl-2 pr-[12px] py-1 text-[12px] text-slate-700 outline-none h-7 shadow-sm text-right transition-all ${hasError ? 'border-red-500 bg-red-50 ring-1 ring-red-200' : 'border-slate-300 bg-white focus:border-blue-500'
                        }`}
                    placeholder={currentLabel}
                    value={isOpen ? searchTerm : currentLabel}
                    onFocus={() => { setIsOpen(true); setSearchTerm(''); }}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                {isOpen && (
                    <div className="absolute top-full right-0 left-0 z-[100] mt-1 max-h-40 overflow-y-auto rounded border border-slate-200 bg-white shadow-lg">
                        {filteredOptions.map(opt => (
                            <div key={opt.value} className="px-2 py-1 text-[11px] hover:bg-blue-50 cursor-pointer text-slate-700 text-right border-b border-slate-50 last:border-0"
                                onClick={() => { onChange(opt.value); setIsOpen(false); setSearchTerm(''); }}>
                                {opt.label}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </FilterRow>
    );
};

interface ProcessFiltersProps {
    onFilter: (filters: any) => void;
    onReset: () => void;
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    externalFilters?: any;
    autoSubmit?: boolean;
}

export const ProcessFilters: React.FC<ProcessFiltersProps> = ({ onFilter, onReset, isOpen, setIsOpen, externalFilters, autoSubmit }) => {
    const { lovs } = useApp();

    const [errors, setErrors] = useState<Record<string, string>>({});

    const initialFilters = useMemo(() => ({
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
    }), []);

    const [filters, setFilters] = useState(initialFilters);
    const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);

    useEffect(() => {
        if (externalFilters && !hasAutoSubmitted) {
            const mergedFilters = { ...initialFilters, ...externalFilters };
            setFilters(mergedFilters);

            if (autoSubmit) {
                onFilter(mergedFilters);
                setHasAutoSubmitted(true);
            }
        }
    }, [externalFilters, autoSubmit, hasAutoSubmitted, initialFilters, onFilter]);

    const options = useMemo(() => {
        // פונקציית ניקוי מושלמת: מסננת כפילויות מטיבקו ושותלת "-ללא-" אחד ויחיד בכל רשימה
        const getOptionsFromLOV = (categoryKey: string) => {
            const group = lovs?.[categoryKey];
            const items = group?.item;
            if (!items || !Array.isArray(items)) return [{ value: '', label: '-ללא-' }];

            const cleanItems = items.map((opt: any) => {
                const val = opt.value?.["$"] || opt.value || opt.code || "";
                const lbl = opt.label?.["$"] || opt.label || opt.displayValue?.["$"] || opt.displayValue || opt.name?.["$"] || opt.name || val;
                return {
                    value: typeof val === 'string' ? val.trim() : String(val),
                    label: typeof lbl === 'string' ? lbl.trim() : String(lbl)
                };
            }).filter((opt: any) => opt.label !== '-ללא-' && opt.value !== '' && opt.value !== 'None');

            return [{ value: '', label: '-ללא-' }, ...cleanItems];
        };

        return {
            processTypes: getOptionsFromLOV('byProcessType'),
            statuses: getOptionsFromLOV('byStatus'),
            stages: getOptionsFromLOV('byState'),
            operators: getOptionsFromLOV('byBusiness'),
            networks: getOptionsFromLOV('byNetwork'),
            customerProfiles: getOptionsFromLOV('byCustomerProfile'),
        };
    }, [lovs]);

    const handleChange = (field: string, value: string) => {
        setErrors(prev => {
            const newErr = { ...prev };
            delete newErr[field];
            if (field === 'fromDateTime' || field === 'toDateTime') {
                delete newErr.fromDateTime;
                delete newErr.toDateTime;
            }
            if (field === 'mobileStart' || field === 'mobileRecEnd') {
                delete newErr.mobileStart;
                delete newErr.mobileRecEnd;
            }
            return newErr;
        });

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
        const newErrors: Record<string, string> = {};
        const isDigitsOnly = (val: string) => /^\d+$/.test(val);
        const isIsraeliPhone = (val: string) => /^(05\d{8}|0[23489]\d{7})$/.test(val);

        if (new Date(filters.fromDateTime) > new Date(filters.toDateTime)) {
            newErrors.fromDateTime = "תאריך התחלה חייב להיות מוקדם מסיום";
            newErrors.toDateTime = " ";
        }

        if (filters.requestId && !/^NP[A-Z0-9]+$/.test(filters.requestId)) {
            newErrors.requestId = "מזהה בקשה חייב להתחיל ב-NP";
        }

        if (filters.mobileAband && !isDigitsOnly(filters.mobileAband)) newErrors.mobileAband = "מספרים בלבד";
        if (filters.mobileRec && !isDigitsOnly(filters.mobileRec)) newErrors.mobileRec = "מספרים בלבד";

        if (filters.filterByNum === "SINGLE") {
            if (!filters.mobileStart || !isIsraeliPhone(filters.mobileStart)) {
                newErrors.mobileStart = "נא להזין מספר טלפון תקין";
            }
        }

        if (filters.filterByNum === "RANGE") {
            let hasFormatError = false;
            if (!filters.mobileStart || !isIsraeliPhone(filters.mobileStart)) {
                newErrors.mobileStart = "מספר טלפון לא תקין";
                hasFormatError = true;
            }
            if (!filters.mobileRecEnd || !isIsraeliPhone(filters.mobileRecEnd)) {
                newErrors.mobileRecEnd = "מספר טלפון לא תקין";
                hasFormatError = true;
            }

            if (!hasFormatError && Number(filters.mobileStart) >= Number(filters.mobileRecEnd)) {
                newErrors.mobileStart = "תחילת הטווח חייבת להיות קטנה מסוף הטווח";
                newErrors.mobileRecEnd = " ";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleResetClick = () => {
        setErrors({});
        setFilters(initialFilters);
        onReset();
    };

    const getInputClass = (fieldName: string) => {
        const base = "w-[200px] rounded border px-2 py-1 text-[12px] outline-none h-7 shadow-sm text-right transition-all";
        return errors[fieldName]
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
                        <div className="grid grid-cols-2 gap-x-12 gap-y-1 w-fit">
                            <div className="space-y-1">
                                <FilterRow label="מזהה בקשה" error={errors.requestId}>
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
                                    <NpgDatePicker
                                        value={filters.fromDateTime}
                                        onChange={(val) => handleChange('fromDateTime', val)}
                                        showTime={true}
                                        error={errors.fromDateTime}
                                    />
                                </FilterRow>

                                <FilterRow label="עד תאריך">
                                    <NpgDatePicker
                                        value={filters.toDateTime}
                                        onChange={(val) => handleChange('toDateTime', val)}
                                        showTime={true}
                                        error={errors.toDateTime}
                                    />
                                </FilterRow>

                                <FilterRow label="מספר מוביל -מפעיל ננטש" error={errors.mobileAband}>
                                    <input type="text" className={getInputClass('mobileAband')} value={filters.mobileAband} onKeyDown={handleNumberOnlyKeyDown} onChange={(e) => handleChange('mobileAband', e.target.value)} />
                                </FilterRow>
                                <FilterRow label="מספר מוביל -מפעיל קולט" error={errors.mobileRec}>
                                    <input type="text" className={getInputClass('mobileRec')} value={filters.mobileRec} onKeyDown={handleNumberOnlyKeyDown} onChange={(e) => handleChange('mobileRec', e.target.value)} />
                                </FilterRow>
                            </div>

                            <div className="space-y-1">
                                <FilterRow label="סנן לפי מספר">
                                    <select className={getInputClass('filterByNum')} value={filters.filterByNum} onChange={(e) => handleChange('filterByNum', e.target.value)}>
                                        <option value="">-ללא-</option>
                                        <option value="SINGLE">לפי מספר</option>
                                        <option value="RANGE">לפי טווח מספרים</option>
                                    </select>
                                </FilterRow>

                                {filters.filterByNum && (
                                    <>
                                        <FilterRow label={filters.filterByNum === "SINGLE" ? "מספר" : "תחילת טווח"} error={errors.mobileStart}>
                                            <input type="text" className={getInputClass('mobileStart')} value={filters.mobileStart} onKeyDown={handleNumberOnlyKeyDown} onChange={(e) => handleChange('mobileStart', e.target.value)} />
                                        </FilterRow>
                                        {filters.filterByNum === "RANGE" && (
                                            <FilterRow label="סוף טווח" error={errors.mobileRecEnd}>
                                                <input type="text" className={getInputClass('mobileRecEnd')} value={filters.mobileRecEnd} onKeyDown={handleNumberOnlyKeyDown} onChange={(e) => handleChange('mobileRecEnd', e.target.value)} />
                                            </FilterRow>
                                        )}
                                    </>
                                )}

                                <AutocompleteField label="סינון לפי מפעיל" options={options.operators} value={filters.filterByOp} onChange={(v) => handleChange('filterByOp', v)} hasError={!!errors.filterByOp} />
                                <AutocompleteField label="סינון לפי רשת" options={options.networks} value={filters.filterByNet} onChange={(v) => handleChange('filterByNet', v)} hasError={!!errors.filterByNet} />

                                <FilterRow label="סוג תהליך">
                                    <select className={getInputClass('processType')} value={filters.processType} onChange={(e) => handleChange('processType', e.target.value)}>
                                        {options.processTypes.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </FilterRow>

                                <AutocompleteField label="סינון לפי מצב" options={options.statuses} value={filters.processStatus} onChange={(v) => handleChange('processStatus', v)} hasError={!!errors.processStatus} />
                                <AutocompleteField label="סינון לפי שלב" options={options.stages} value={filters.processStep} onChange={(v) => handleChange('processStep', v)} hasError={!!errors.processStep} />

                                <FilterRow label="פרופיל לקוח">
                                    <select className={getInputClass('customerProfile')} value={filters.customerProfile} onChange={(e) => handleChange('customerProfile', e.target.value)}>
                                        {options.customerProfiles.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                    </select>
                                </FilterRow>
                            </div>
                        </div>
                        <div className="flex justify-start gap-2 mt-6 pt-3 border-t border-slate-100">
                            <button type="submit" className="bg-[#4B9CD3] text-white px-6 py-1.5 rounded text-xs font-bold hover:bg-[#357ABD]">בצע חיפוש</button>
                            <button type="button" onClick={handleResetClick} className="border border-slate-300 bg-slate-50 text-slate-600 px-6 py-1.5 rounded text-xs font-bold hover:bg-slate-200">איפוס</button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};