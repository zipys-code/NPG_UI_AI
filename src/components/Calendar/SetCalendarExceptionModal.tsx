import React, { useState, useEffect } from 'react';
import { X, CalendarDays, Save, AlertCircle } from 'lucide-react';
import { apiRequest } from "@/services/api";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

interface SetCalendarExceptionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    calendarId: string;
    editData?: any;
}

export const SetCalendarExceptionModal: React.FC<SetCalendarExceptionModalProps> = ({ isOpen, onClose, onSuccess, calendarId, editData }) => {
    const { currentNetworkId, currentUser, token } = useApp();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        date: '', // נשמר בפורמט yyyy-mm-dd עבור ה-input
        fromHour: '00',
        fromMinute: '00',
        toHour: '23',
        toMinute: '59',
        isWorkDay: true
    });

    const isEdit = !!editData;

    // פונקציית עזר להמרת פורמט תאריך מ-dd/mm/yyyy ל-yyyy-mm-dd עבור ה-HTML Date picker
    const formatDateForInput = (dateStr: string) => {
        if (!dateStr || !dateStr.includes('/')) return '';
        const [d, m, y] = dateStr.split('/');
        return `${y}-${m}-${d}`;
    };

    // פונקציית עזר להמרת תאריך מ-yyyy-mm-dd חזרה ל-dd/mm/yyyy עבור טיבקו
    const formatDateForTIBCO = (dateStr: string) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    };

    // קבלת תאריך וזמן נוכחי בפורמט טיבקו עבור שדות החובה
    const getNowForTIBCO = () => {
        const now = new Date();
        const d = now.getDate().toString().padStart(2, '0');
        const m = (now.getMonth() + 1).toString().padStart(2, '0');
        const y = now.getFullYear();
        const hh = now.getHours().toString().padStart(2, '0');
        const mm = now.getMinutes().toString().padStart(2, '0');
        return { date: `${d}/${m}/${y}`, time: `${hh}:${mm}` };
    };

    useEffect(() => {
        if (isOpen) {
            if (isEdit && editData) {
                const [fH, fM] = (editData.SoBH || "00:00").split(':');
                const [tH, tM] = (editData.EoBH || "23:59").split(':');
                setFormData({
                    date: formatDateForInput(editData.date),
                    fromHour: fH, fromMinute: fM,
                    toHour: tH, toMinute: tM,
                    isWorkDay: editData.workDay === "1" || editData.WORK_DAY === "1"
                });
            } else {
                // ברירת מחדל למחר
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setFormData({
                    date: tomorrow.toISOString().split('T')[0],
                    fromHour: '00', fromMinute: '00',
                    toHour: '23', toMinute: '59',
                    isWorkDay: true
                });
            }
            setServerError(null);
        }
    }, [isOpen, editData]);

    const handleSubmit = async () => {
        const start = Number(formData.fromHour) * 60 + Number(formData.fromMinute);
        const end = Number(formData.toHour) * 60 + Number(formData.toMinute);

        if (start >= end) {
            setServerError("שעת התחלה חייבת להיות מוקדמת משעת סיום");
            return;
        }

        const confirmMessage = isEdit ? "האם את/ה בטוח שברצונך לעדכן את היום החריג?"
            : "האם את/ה בטוח שברצונך להוסיף יום חריג?";
        if (!window.confirm(confirmMessage)) return;
        setServerError(null);
        setIsSubmitting(true);
        const now = getNowForTIBCO();

        const payload = {
            setIn: {
                mode: isEdit ? "MODIFY_EXCEPTION_DAY" : "ADD_EXCEPTION_DAY",
                calendarId: calendarId,
                // אם עריכה - שולחים מקורי, אם חדש - שולחים "עכשיו" כדי לא להשאיר ריק
                originalDay: isEdit ? editData.date : now.date,
                originalSobh: isEdit ? editData.SoBH : now.time,
                date: formatDateForTIBCO(formData.date),
                workDay: formData.isWorkDay ? "1" : "0",
                SoBH: `${formData.fromHour}:${formData.fromMinute}`,
                EoBH: `${formData.toHour}:${formData.toMinute}`,
                token: token,
                selfNetworkID: currentNetworkId,
                user: currentUser?.name || "אורח",
                ...(isEdit ? {
                    originalDay: editData.date, // התאריך המקורי לפני השינוי
                    originalSobh: editData.SoBH  // השעה המקורית לפני השינוי
                } : {})
            }
        };

        try {
            const response = await apiRequest("/SetCalendarException", payload);
            const notification = response?.setOut?.notification?.msg?.[0];

            if (notification?.code?.toString() === "1000") {
                toast.success("הפעולה בוצעה בהצלחה");
                onSuccess();
                onClose();
            } else {
                setServerError(notification?.msgBody || "שגיאה בעדכון היום החריג");
            }
        } catch (error) {
            setServerError("שגיאת תקשורת מול השרת");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 rtl" dir="rtl">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
                <div className="bg-blue-600 p-5 flex justify-between items-center text-white">
                    <div className="flex items-center gap-3">
                        <CalendarDays size={22} />
                        <h2 className="text-lg font-bold">{isEdit ? "עדכון יום חריג" : "הוספת יום חריג"}</h2>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/20 p-1.5 rounded-full"><X size={20} /></button>
                </div>

                <div className="p-8 space-y-5">
                    {serverError && (
                        <div className="p-3 bg-red-50 border-r-4 border-red-500 text-red-700 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                            <AlertCircle size={16} /> {serverError}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1 text-right">בחר תאריך *</label>
                        {/* שימוש ב-input מסוג date עבור לוח שנה מובנה */}
                        <input
                            type="date"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none"
                            value={formData.date}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-slate-500 text-right">משעה</label>
                            <div className="flex gap-1" dir="ltr">
                                <select className="border rounded-lg p-2 text-sm w-full" value={formData.fromHour} onChange={(e) => setFormData({ ...formData, fromHour: e.target.value })}>
                                    {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                                <select className="border rounded-lg p-2 text-sm w-full" value={formData.fromMinute} onChange={(e) => setFormData({ ...formData, fromMinute: e.target.value })}>
                                    {["00", "15", "30", "45", "59"].map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="block text-xs font-bold text-slate-500 text-right">עד שעה</label>
                            <div className="flex gap-1" dir="ltr">
                                <select className="border rounded-lg p-2 text-sm w-full" value={formData.toHour} onChange={(e) => setFormData({ ...formData, toHour: e.target.value })}>
                                    {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                                <select className="border rounded-lg p-2 text-sm w-full" value={formData.toMinute} onChange={(e) => setFormData({ ...formData, toMinute: e.target.value })}>
                                    {["00", "15", "30", "45", "59"].map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100 cursor-pointer" onClick={() => setFormData({ ...formData, isWorkDay: !formData.isWorkDay })}>
                        <input type="checkbox" className="w-5 h-5 accent-blue-600 cursor-pointer" checked={formData.isWorkDay} onChange={(e) => setFormData({ ...formData, isWorkDay: e.target.checked })} />
                        <span className="text-sm font-bold text-blue-800 italic">האם יום עבודה?</span>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border-t flex items-center justify-between px-8">
                    <button onClick={handleSubmit} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all active:scale-95 disabled:opacity-50">
                        {isSubmitting ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (isEdit ? "עדכן יום" : "שמור יום חריג")}
                    </button>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-sm transition-colors">ביטול</button>
                </div>
            </div>
        </div>
    );
};