import React, { useState } from 'react';
import { Search, RotateCcw, ChevronUp, ChevronDown } from 'lucide-react';

export const ProcessFilters = ({ onFilter }: { onFilter: (filters: any) => void }) => {
    const [isOpen, setIsOpen] = useState(true);

    const getFormattedDate = (daysAgo = 0) => {
        const d = new Date();
        d.setDate(d.getDate() - daysAgo);
        return d.toISOString().split('T')[0];
    };

    const [filters, setFilters] = useState({
        lrn: '',
        groupId: '',
        customerId: '',
        fromDateTime: `${getFormattedDate(7)}T00:00`,
        toDateTime: `${getFormattedDate(0)}T23:59`,
        mobileAband: '',
        mobileRec: '',
        filterByNum: '',
        filterByOp: '',
        filterByNet: '',
        processType: '',
        processStatus: '',
        processStep: '',
        customerProfile: ''
    });

    const handleChange = (field: string, value: string) => {
        setFilters(prev => ({ ...prev, [field]: value }));
    };

    const handleReset = () => {
        const resetValues = {
            lrn: '', groupId: '', customerId: '',
            fromDateTime: `${getFormattedDate(7)}T00:00`,
            toDateTime: `${getFormattedDate(0)}T23:59`,
            mobileAband: '', mobileRec: '', filterByNum: '',
            filterByOp: '', filterByNet: '', processType: '',
            processStatus: '', processStep: '', customerProfile: ''
        };
        setFilters(resetValues);
        onFilter(resetValues);
    };

    const inputClassName = "w-[200px] rounded border border-slate-300 bg-white px-2 py-1 text-[12px] text-slate-700 outline-none focus:border-blue-500 transition-all text-right h-7 shadow-sm";

    return (
        <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 mb-4 overflow-hidden" dir="rtl">

            {/* כותרת הפאנל - מיושרת לימין (justify-start ב-RTL) */}
            <div
                className="flex items-center justify-start gap-2 p-2.5 px-4 cursor-pointer hover:bg-slate-50 transition-colors border-b border-slate-100 bg-slate-50/30"
                onClick={() => setIsOpen(!isOpen)}
            >
                {/* האייקון והטקסט צמודים לימין */}
                {isOpen ? <ChevronUp size={14} className="text-blue-600" /> : <ChevronDown size={14} className="text-blue-600" />}
                <span className="text-[12px] font-bold text-blue-700 select-none">סינון נוכחי</span>
            </div>

            {/* גוף הפילטרים */}
            {isOpen && (
                <div className="p-4 transition-all">
                    <form onSubmit={(e) => { e.preventDefault(); onFilter(filters); }}>
                        <div className="grid grid-cols-2 gap-x-12 gap-y-2 w-fit">
                            {/* עמודה ימנית */}
                            <div className="space-y-2">
                                <FilterRow label="מזהה בקשה">
                                    <input type="text" className={inputClassName} value={filters.lrn} onChange={(e) => handleChange('lrn', e.target.value)} />
                                </FilterRow>
                                <FilterRow label="מספר קבוצה">
                                    <input type="text" className={inputClassName} value={filters.groupId} onChange={(e) => handleChange('groupId', e.target.value)} />
                                </FilterRow>
                                <FilterRow label="מזהה לקוח">
                                    <input type="text" className={inputClassName} value={filters.customerId} onChange={(e) => handleChange('customerId', e.target.value)} />
                                </FilterRow>
                                <FilterRow label="מתאריך">
                                    <input type="datetime-local" className={inputClassName} value={filters.fromDateTime} onChange={(e) => handleChange('fromDateTime', e.target.value)} />
                                </FilterRow>
                                <FilterRow label="עד תאריך">
                                    <input type="datetime-local" className={inputClassName} value={filters.toDateTime} onChange={(e) => handleChange('toDateTime', e.target.value)} />
                                </FilterRow>
                                <FilterRow label="מספר מוביל - ננטש">
                                    <input type="text" className={inputClassName} value={filters.mobileAband} onChange={(e) => handleChange('mobileAband', e.target.value)} />
                                </FilterRow>
                                <FilterRow label="מספר מוביל - קולט">
                                    <input type="text" className={inputClassName} value={filters.mobileRec} onChange={(e) => handleChange('mobileRec', e.target.value)} />
                                </FilterRow>
                            </div>

                            {/* עמודה שמאלית */}
                            <div className="space-y-2">
                                <FilterRow label="סנן לפי מספר">
                                    <select className={inputClassName} value={filters.filterByNum} onChange={(e) => handleChange('filterByNum', e.target.value)}><option value="">-ללא-</option></select>
                                </FilterRow>
                                <FilterRow label="סינון לפי מפעיל">
                                    <select className={inputClassName} value={filters.filterByOp} onChange={(e) => handleChange('filterByOp', e.target.value)}><option value="">-ללא-</option></select>
                                </FilterRow>
                                <FilterRow label="סינון לפי רשת">
                                    <select className={inputClassName} value={filters.filterByNet} onChange={(e) => handleChange('filterByNet', e.target.value)}><option value="">-ללא-</option></select>
                                </FilterRow>
                                <FilterRow label="סוג תהליך">
                                    <select className={inputClassName} value={filters.processType} onChange={(e) => handleChange('processType', e.target.value)}><option value="">-ללא-</option></select>
                                </FilterRow>
                                <FilterRow label="סינון לפי מצב">
                                    <select className={inputClassName} value={filters.processStatus} onChange={(e) => handleChange('processStatus', e.target.value)}><option value="">-ללא-</option></select>
                                </FilterRow>
                                <FilterRow label="סינון לפי שלב">
                                    <select className={inputClassName} value={filters.processStep} onChange={(e) => handleChange('processStep', e.target.value)}><option value="">-ללא-</option></select>
                                </FilterRow>
                                <FilterRow label="פרופיל לקוח">
                                    <select className={inputClassName} value={filters.customerProfile} onChange={(e) => handleChange('customerProfile', e.target.value)}>
                                        <option value="">-ללא-</option>
                                        <option value="private">פרטי</option>
                                        <option value="business">עסקי</option>
                                    </select>
                                </FilterRow>
                            </div>
                        </div>

                        <div className="flex justify-start gap-2 mt-6 pt-3 border-t border-slate-100">
                            <button type="submit" className="flex items-center gap-1.5 bg-[#4B9CD3] text-white px-4 py-1.5 rounded text-xs font-bold hover:bg-[#357ABD] transition-all shadow-sm">
                                <Search size={14} /> בצע חיפוש
                            </button>
                            <button type="button" onClick={handleReset} className="flex items-center gap-1.5 border border-slate-300 bg-slate-50 text-slate-600 px-4 py-1.5 rounded text-xs font-bold hover:bg-slate-100 transition-all shadow-sm">
                                <RotateCcw size={14} /> איפוס
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

const FilterRow = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div className="flex items-center gap-3 h-7">
        <label className="text-[11px] font-medium text-slate-600 w-32 text-right shrink-0">
            {label}
        </label>
        <div className="w-[200px]">
            {children}
        </div>
    </div>
);