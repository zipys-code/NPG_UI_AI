import React, { useState, useMemo } from 'react';
import { X, Send, Check, AlertCircle, CheckSquare, Square } from 'lucide-react';
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

export const AddInquiryModal = ({ isOpen, onClose, onSave, serverErrors = [] }: any) => {
    const { lovs, currentNetworkId } = useApp();
    const [dnNumber, setDnNumber] = useState('');
    const [selectedOperators, setSelectedOperators] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    const groups = useMemo(() => {
        const allItems = lovs?.byBusiness?.item || [];
        const filtered = allItems.filter((op: any) =>
            op.label !== "-ללא-" && String(op.value) !== String(currentNetworkId)
        );

        return {
            mobile: filtered.filter((op: any) => op.aditinalData1?.trim().toUpperCase() === 'M'),
            fixed: filtered.filter((op: any) => op.aditinalData1?.trim().toUpperCase() === 'F'),
        };
    }, [lovs, currentNetworkId]);

    const toggleOperator = (id: string) => {
        setSelectedOperators(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    // פונקציית בחירת הכל לקבוצה ספציפית
    const toggleGroup = (groupItems: any[], isAllSelected: boolean) => {
        const groupIds = groupItems.map(op => op.value);
        if (isAllSelected) {
            setSelectedOperators(prev => prev.filter(id => !groupIds.includes(id)));
        } else {
            setSelectedOperators(prev => Array.from(new Set([...prev, ...groupIds])));
        }
    };

    const handleSave = async () => {
        if (!dnNumber.trim() || !/^\d+$/.test(dnNumber)) {
            toast.error("יש להזין מספר טלפון תקין (ספרות בלבד)");
            return;
        }
        if (selectedOperators.length === 0) {
            toast.error("יש לבחור לפחות מפעיל אחד");
            return;
        }
        setIsSaving(true);
        const result = await onSave({ dnNumber, operatorIds: selectedOperators });
        if (result?.success) {
            setDnNumber('');
            setSelectedOperators([]);
        }
        setIsSaving(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center bg-slate-900/50 backdrop-blur-sm p-4 pt-20 rtl text-right" dir="rtl">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-blue-600 px-6 py-3 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-2 text-white font-bold text-base">
                        <Send size={18} />
                        <span>שאילתת מספר - שלח שאילתה</span>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <X size={22} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto">
                    {/* שגיאות שרת */}
                    {serverErrors.length > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-2 mb-4 shadow-sm animate-in fade-in slide-in-from-top-1">
                            <div className="flex items-center gap-2 text-red-700 font-bold text-sm mb-2">
                                <AlertCircle size={18} />
                                <span>חלו שגיאות בביצוע הפעולה:</span>
                            </div>
                            <div className="mr-6 space-y-2">
                                {serverErrors.map((err, idx) => {
                                    // ניקוי תגיות ה-BR מהשרת ופיצול לשורות אמיתיות
                                    const cleanLines = err.replace(/<\/br>/g, '\n').split('\n');

                                    return (
                                        <div key={idx} className="space-y-1">
                                            {cleanLines.map((line, lIdx) => (
                                                line.trim() && (
                                                    <p key={lIdx} className="text-red-600 text-[12px] font-medium leading-relaxed flex items-start gap-1.5">
                                                        <span className="shrink-0 mt-1.5 w-1 h-1 bg-red-400 rounded-full" />
                                                        {line.trim()}
                                                    </p>
                                                )
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* שדה מספר טלפון */}
                    <div className="flex items-center gap-3 mb-6 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <label className="text-[12px] font-bold text-slate-700 w-24">מספר טלפון*</label>
                        <input
                            type="text"
                            value={dnNumber}
                            onChange={(e) => setDnNumber(e.target.value)}
                            className="w-[200px] border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                            placeholder="הזן מספר לבירור..."
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-10">
                        {/* עמודת נייח (2 עמודות פנימיות) */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-end border-b-2 border-blue-600 pb-1">
                                <h4 className="text-[14px] font-black text-blue-900">נייח ({groups.fixed.length})</h4>
                                <button
                                    onClick={() => toggleGroup(groups.fixed, groups.fixed.every(op => selectedOperators.includes(op.value)))}
                                    className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                                >
                                    {groups.fixed.every(op => selectedOperators.includes(op.value)) ? 'בטל בחירת הכל' : 'בחר הכל נייח'}
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {groups.fixed.map((op: any) => (
                                    <OperatorCard key={op.value} op={op} isSelected={selectedOperators.includes(op.value)} onToggle={() => toggleOperator(op.value)} color="blue" />
                                ))}
                            </div>
                        </div>

                        {/* עמודת נייד (2 עמודות פנימיות) */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-end border-b-2 border-emerald-600 pb-1">
                                <h4 className="text-[14px] font-black text-emerald-900">נייד ({groups.mobile.length})</h4>
                                <button
                                    onClick={() => toggleGroup(groups.mobile, groups.mobile.every(op => selectedOperators.includes(op.value)))}
                                    className="text-[10px] font-bold text-emerald-600 hover:underline flex items-center gap-1"
                                >
                                    {groups.mobile.every(op => selectedOperators.includes(op.value)) ? 'בטל בחירת הכל' : 'בחר הכל נייד'}
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                {groups.mobile.map((op: any) => (
                                    <OperatorCard key={op.value} op={op} isSelected={selectedOperators.includes(op.value)} onToggle={() => toggleOperator(op.value)} color="emerald" />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
                    <button onClick={onClose} className="px-6 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-200 transition-all">ביטול</button>
                    <button disabled={isSaving} onClick={handleSave} className="px-10 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95">
                        {isSaving ? "שולח..." : <><Send size={16} /> שלח שאילתה</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

const OperatorCard = ({ op, isSelected, onToggle, color }: any) => {
    const activeClass = color === 'blue' ? 'bg-blue-50 border-blue-400 text-blue-800' : 'bg-emerald-50 border-emerald-400 text-emerald-800';
    const checkClass = color === 'blue' ? 'bg-blue-600' : 'bg-emerald-600';

    return (
        <div
            onClick={onToggle}
            className={`flex items-center gap-2 p-1.5 rounded border cursor-pointer transition-all hover:shadow-sm ${isSelected ? activeClass : 'bg-white border-slate-100 text-slate-500 hover:border-slate-300'}`}
        >
            <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${isSelected ? `${checkClass} border-transparent text-white` : 'bg-white border-slate-300'}`}>
                {isSelected && <Check size={10} strokeWidth={4} />}
            </div>
            <span className="text-[10px] font-bold truncate leading-none">{op.label}</span>
        </div>
    );
};