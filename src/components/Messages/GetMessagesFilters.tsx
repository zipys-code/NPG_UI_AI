import React, { useState, useEffect, useMemo } from 'react';
import { ChevronUp, ChevronDown, Search } from 'lucide-react';
import { useApp } from "@/context/AppContext";
import { AutocompleteField } from '../Share/AutocompleteField';
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

/* const getCleanOptions = (items: any) => {
    if (!items || !Array.isArray(items)) return [];

    return items.map((opt: any) => {
        const rawVal = opt.value?.["$"] || opt.value || opt.code || "";
        const rawLabel = opt.label?.["$"] || opt.label || opt.displayValue?.["$"] || opt.displayValue || opt.name?.["$"] || opt.name || rawVal;

        return {
            value: typeof rawVal === 'string' ? rawVal.trim() : String(rawVal),
            label: typeof rawLabel === 'string' ? rawLabel.trim() : String(rawLabel)
        };
    }).filter((opt: any) => opt.value !== '' && opt.label !== '-ללא-');
}; */

const getCleanOptions = (items: any) => {
    if (!items || !Array.isArray(items)) return [];

    return items.map((opt: any) => {
        const rawVal = opt.value?.["$"] || opt.value || opt.code || "";
        const rawLabel = opt.label?.["$"] || opt.label || opt.displayValue?.["$"] || opt.displayValue || opt.name?.["$"] || opt.name || rawVal;

        return {
            value: typeof rawVal === 'string' ? rawVal.trim() : String(rawVal),
            label: typeof rawLabel === 'string' ? rawLabel.trim() : String(rawLabel)
        };
    }).filter((opt: any) => opt.value !== ''); // כאן השינוי - השארנו רק סינון של ערכים ריקים ממש
};

export const GetMessagesFilters = ({ onFilter, onReset, isOpen, setIsOpen, externalFilters, autoSubmit }: any) => {
    const { lovs } = useApp();

    // 🌟 התיקון כאן: עטפנו את האתחול ב-useMemo כדי שהאובייקט יישמר בזיכרון ולא ייווצר מחדש
    const initialFilters = useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return {
            requestId: '',
            msgType: 'None',
            msgStatus: 'None',
            operator: '',
            dateFrom: `${today}T00:00`,
            dateTo: `${today}T23:59`,
        };
    }, []);

    const [filters, setFilters] = useState(initialFilters);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [hasAutoSubmitted, setHasAutoSubmitted] = useState(false);

    useEffect(() => {
        if (externalFilters && !hasAutoSubmitted) {
            const merged = { ...initialFilters };

            if (externalFilters.operatorName) {
                merged.operator = externalFilters.operatorName;
            }

            if (externalFilters.fromDateTime) {
                merged.dateFrom = externalFilters.fromDateTime;
            }
            if (externalFilters.toDateTime) {
                merged.dateTo = externalFilters.toDateTime;
            }

            setFilters(merged);

            if (autoSubmit) {
                const formatToTibcoDate = (isoStr: string) => {
                    if (!isoStr) return "";
                    const [datePart] = isoStr.split("T");
                    const [y, m, d] = datePart.split("-");
                    return `${d}/${m}/${y}`;
                };

                const extractTime = (isoStr: string) => {
                    return isoStr.includes('T') ? isoStr.split('T')[1].substring(0, 5) : '00:00';
                };

                onFilter({
                    ...merged,
                    dateFrom: formatToTibcoDate(merged.dateFrom),
                    dateTo: formatToTibcoDate(merged.dateTo),
                    timeFrom: extractTime(merged.dateFrom),
                    timeTo: extractTime(merged.dateTo)
                });
                setHasAutoSubmitted(true);
            }
        }
    }, [externalFilters, autoSubmit, hasAutoSubmitted, initialFilters, onFilter]);

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!filters.requestId.trim() && filters.msgType === 'None' && !filters.operator) {
            newErrors.general = "יש לבחור סוג מסר או להזין מספר בקשה לסינון";
            newErrors.requestId = " ";
            newErrors.msgType = " ";
        }

        if (filters.requestId && !filters.requestId.toUpperCase().startsWith('NP')) {
            newErrors.requestId = "מזהה בקשה חייב להתחיל ב-NP";
        }

        const fromDateObj = new Date(filters.dateFrom.replace(' ', 'T'));
        const toDateObj = new Date(filters.dateTo.replace(' ', 'T'));

        if (fromDateObj > toDateObj) {
            newErrors.dateFrom = "תאריך התחלה חייב להיות קטן או שווה לסיום";
            newErrors.dateTo = " ";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        const formatToTibcoDate = (isoStr: string) => {
            if (!isoStr) return "";
            const [datePart] = isoStr.split("T");
            const [y, m, d] = datePart.split("-");
            return `${d}/${m}/${y}`;
        };

        const extractTime = (isoStr: string) => {
            return isoStr.includes('T') ? isoStr.split('T')[1].substring(0, 5) : '00:00';
        };

        onFilter({
            ...filters,
            dateFrom: formatToTibcoDate(filters.dateFrom),
            dateTo: formatToTibcoDate(filters.dateTo),
            timeFrom: extractTime(filters.dateFrom),
            timeTo: extractTime(filters.dateTo)
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
        ${errors[fieldName] ? 'border-red-500 bg-red-50 ring-1 ring-red-200' : 'border-slate-200 bg-white focus:border-blue-500'}
    `;

    const handleChange = (field: string, value: any) => {
        setErrors(prev => {
            const newErr = { ...prev };
            delete newErr[field];
            delete newErr.general;
            if (field === 'dateFrom' || field === 'dateTo') {
                delete newErr.dateFrom;
                delete newErr.dateTo;
            }
            return newErr;
        });
        setFilters(prev => ({ ...prev, [field]: value }));
    };

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
                        <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-xs font-bold text-center w-fit mx-auto">
                            {errors.general}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12 w-fit">
                        <div className="space-y-2">
                            <FilterRow label="מזהה בקשה" error={errors.requestId}>
                                <input
                                    type="text"
                                    className={getInputClass('requestId')}
                                    value={filters.requestId}
                                    onChange={(e) => handleChange('requestId', e.target.value.toUpperCase())}
                                    placeholder="NP..."
                                />
                            </FilterRow>

                            <FilterRow label="מתאריך" >
                                <NpgDatePicker
                                    value={filters.dateFrom}
                                    onChange={(val) => handleChange('dateFrom', val)}
                                    showTime={true}
                                    error={errors.dateFrom}
                                />
                            </FilterRow>

                            <FilterRow label="עד תאריך" >
                                <NpgDatePicker
                                    value={filters.dateTo}
                                    onChange={(val) => handleChange('dateTo', val)}
                                    showTime={true}
                                    error={errors.dateTo}
                                />
                            </FilterRow>
                        </div>

                        <div className="space-y-2">
                            <FilterRow label="סוג מסר" error={errors.msgType}>
                                <div className="w-[400px]">
                                    <AutocompleteField
                                        label=""
                                        options={getCleanOptions(lovs?.byMessageTypes?.item)}
                                        value={filters.msgType}
                                        onChange={(v: any) => handleChange('msgType', v)}
                                        hasError={!!errors.msgType}
                                    />
                                </div>
                            </FilterRow>

                            {/* <FilterRow label="מפעיל">
                                <select
                                    className={getInputClass('operator')}
                                    value={filters.operator}
                                    onChange={(e) => handleChange('operator', e.target.value)}
                                >
                                    {getCleanOptions(lovs?.byBusiness?.item).map((opt: any) => (
                                        <option key={opt.value} value={opt.value}>
                                            {opt.label}
                                        </option>
                                    ))}
                                </select>
                            </FilterRow> */}

                            <FilterRow label="סטטוס">
                                <select
                                    className={getInputClass('msgStatus')}
                                    value={filters.msgStatus}
                                    onChange={(e) => handleChange('msgStatus', e.target.value)}
                                >
                                    <option value="None">-ללא-</option>
                                    <option value="COMPLETED">COMPLETED</option>
                                    <option value="FAILED">FAILED</option>
                                    <option value="REJECTED">REJECTED</option>
                                    <option value="ACCEPTED">ACCEPTED</option>
                                    <option value="SEND">SEND</option>
                                </select>
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