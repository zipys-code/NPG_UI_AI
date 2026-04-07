import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle2, Info, Send, AlertTriangle } from 'lucide-react';

interface ProcessActionModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: {
        processList?: { item: any[] | any };
        actions?: { item: any[] | any };
        allowCancel?: number | string;
        isPortIn?: number | string;
        notifications?: {
            item: any[] | any;
        };
        // השדה שעדכנו כדי לפתור את השגיאות שצילמת
        validationNotifications?: {
            item: any[] | any;
        };
    } | null;
    onActionExecute: (actionId: string, groupId?: string, additionalData?: any) => void;
}

export const ProcessActionModal: React.FC<ProcessActionModalProps> = ({
    isOpen,
    onClose,
    data,
    onActionExecute
}) => {
    const [selectedAction, setSelectedAction] = useState<string>('');

    // איפוס בחירה כשפותחים את המודאל
    useEffect(() => {
        if (isOpen) setSelectedAction('');
    }, [isOpen]);

    if (!isOpen || !data) return null;

    // חילוץ רשימות בצורה בטוחה
    const actions = data.actions?.item
        ? (Array.isArray(data.actions.item) ? data.actions.item : [data.actions.item])
        : [];

    const processes = data.processList?.item
        ? (Array.isArray(data.processList.item) ? data.processList.item : [data.processList.item])
        : [];

    // חילוץ הודעות רגילות והודעות ולידציה (הלוגיקה שסידרנו)
    const normalMsgs = data.notifications?.item
        ? (Array.isArray(data.notifications.item) ? data.notifications.item : [data.notifications.item])
        : [];

    const validationMsgs = data.validationNotifications?.item
        ? (Array.isArray(data.validationNotifications.item) ? data.validationNotifications.item : [data.validationNotifications.item])
        : [];

    const allMessages = [...normalMsgs, ...validationMsgs].filter(msg => msg?.msgBody?.$);

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" dir="rtl">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100 bg-slate-50">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                            <Send size={20} />
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg">ביצוע פעולה עבור תהליכים</h3>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto space-y-6">
                    {/* הודעות מערכת */}
                    {allMessages.length > 0 && (
                        <div className="space-y-2">
                            {allMessages.map((msg, idx) => {
                                const severity = msg.severity?.$ || 'INFO';
                                return (
                                    <div key={idx} className={`p-4 rounded-xl flex items-start gap-3 border ${severity === 'ERROR' ? 'bg-red-50 border-red-100 text-red-800' :
                                            severity === 'SUCCESS' ? 'bg-green-50 border-green-100 text-green-800' :
                                                'bg-blue-50 border-blue-100 text-blue-800'
                                        }`}>
                                        <div className="mt-0.5">
                                            {severity === 'ERROR' ? <AlertCircle size={18} /> :
                                                severity === 'SUCCESS' ? <CheckCircle2 size={18} /> : <Info size={18} />}
                                        </div>
                                        <div className="text-sm font-medium leading-relaxed">
                                            {msg.msgBody?.$}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* פירוט תהליכים מושפעים */}
                    <div className="bg-slate-50 rounded-xl border border-slate-100 p-4">
                        <div className="text-[11px] font-bold text-slate-400 mb-3 uppercase tracking-wider">תהליכים שנבחרו ({processes.length})</div>
                        <div className="flex flex-wrap gap-2">
                            {processes.map((p, idx) => (
                                <div key={idx} className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-sm font-semibold text-slate-700 shadow-sm flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
                                    {p.dnNumber?.$ || p.npgRequestId?.$}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* בחירת פעולה */}
                    {actions.length > 0 && (
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-700 block px-1">בחר פעולה לביצוע:</label>
                            <div className="grid grid-cols-1 gap-2">
                                {actions.map((action) => (
                                    <button
                                        key={action.actionId?.$}
                                        onClick={() => setSelectedAction(action.actionId?.$)}
                                        className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all text-right ${selectedAction === action.actionId?.$
                                                ? 'border-blue-500 bg-blue-50 shadow-md'
                                                : 'border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50'
                                            }`}
                                    >
                                        <div className="flex flex-col">
                                            <span className={`font-bold ${selectedAction === action.actionId?.$ ? 'text-blue-700' : 'text-slate-700'}`}>
                                                {action.actionName?.$}
                                            </span>
                                            <span className="text-xs text-slate-400">מזהה: {action.actionId?.$}</span>
                                        </div>
                                        {selectedAction === action.actionId?.$ && (
                                            <div className="bg-blue-500 text-white rounded-full p-1">
                                                <CheckCircle2 size={16} />
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-all"
                    >
                        ביטול
                    </button>
                    <button
                        disabled={!selectedAction}
                        onClick={() => onActionExecute(selectedAction)}
                        className={`px-8 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center gap-2 ${selectedAction
                                ? 'bg-blue-600 text-white hover:bg-blue-700 hover:-translate-y-0.5 shadow-blue-200'
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        <Send size={16} />
                        בצע פעולה
                    </button>
                </div>
            </div>
        </div>
    );
};