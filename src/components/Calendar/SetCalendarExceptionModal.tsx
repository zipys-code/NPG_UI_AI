import React, { useState, useEffect } from 'react';
import { X, CalendarDays, AlertCircle } from 'lucide-react';
import { apiRequest } from "@/services/api";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import { NpgDatePicker } from '../Share/NpgDatePicker';

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

    // פישטנו את הסטייט! רק תאריך וזמנים בפורמט נקי
    const [formData, setFormData] = useState({
        date: '',
        fromTime: '00:00',
        toTime: '23:59',
        isWorkDay: true
    });

    const isEdit = !!editData;

    const formatDateForInput = (dateStr: string) => {
        if (!dateStr || !dateStr.includes('/')) return '';
        const [d, m, y] = dateStr.split('/');
        return `${y}-${m}-${d}`;
    };

    const formatDateForTIBCO = (dateStr: string) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    };

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
                setFormData({
                    date: formatDateForInput(editData.date),
                    fromTime: editData.SoBH || "00:00",
                    toTime: editData.EoBH || "23:59",
                    isWorkDay: editData.workDay === "1" || editData.WORK_DAY === "1"
                });
            } else {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                setFormData({
                    date: tomorrow.toISOString().split('T')[0],
                    fromTime: '00:00',
                    toTime: '23:59',
                    isWorkDay: true
                });
            }
            setServerError(null);
        }
    }, [isOpen, editData, isEdit]);

    const handleSubmit = async () => {
        // המרה חכמה ונקייה לבדיקת זמנים
        const [fH, fM] = formData.fromTime.split(':');
        const [tH, tM] = formData.toTime.split(':');
        const start = Number(fH) * 60 + Number(fM);
        const end = Number(tH) * 60 + Number(tM);

        if (start >= end) {
            setServerError("שעת התחלה חייבת להיות מוקדמת משעת סיום");
            return;
        }

        const confirmMessage = isEdit ? "האם את/ה בטוח שברצונך לעדכן את היום החריג?" : "האם את/ה בטוח שברצונך להוסיף יום חריג?";
        if (!window.confirm(confirmMessage)) return;

        setServerError(null);
        setIsSubmitting(true);
        const now = getNowForTIBCO();

        const payload = {
            setIn: {
                mode: isEdit ? "MODIFY_EXCEPTION_DAY" : "ADD_EXCEPTION_DAY",
                calendarId: calendarId,
                originalDay: isEdit ? editData.date : now.date,
                originalSobh: isEdit ? editData.SoBH : now.time,
                date: formatDateForTIBCO(formData.date),
                workDay: formData.isWorkDay ? "1" : "0",
                SoBH: formData.fromTime,
                EoBH: formData.toTime,
                token: token,
                selfNetworkID: currentNetworkId,
                user: currentUser?.name || "אורח",
                ...(isEdit ? {
                    originalDay: editData.date,
                    originalSobh: editData.SoBH
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

    // פונקציית עזר לחילוץ השעה מתוך מחרוזת התאריך המלאה שמחזיר ה-DatePicker
    const extractTime = (val: string, fallback: string) => val.includes('T') ? val.split('T')[1].substring(0, 5) : fallback;

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

                <div className="p-8 space-y-6">
                    {serverError && (
                        <div className="p-3 bg-red-50 border-r-4 border-red-500 text-red-700 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                            <AlertCircle size={16} /> {serverError}
                        </div>
                    )}

                    {/* קומפוננטת התאריך הרגילה שלנו */}
                    <div className="w-full">
                        <NpgDatePicker
                            label="בחר תאריך *"
                            value={formData.date}
                            onChange={(val) => setFormData({ ...formData, date: val })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        {/* שימוש בקומפוננטה שלנו רק עבור שעה */}
                        <NpgDatePicker
                            label="משעה"
                            showDate={false} // מכבה את התאריך
                            showTime={true}  // מדליק את השעה
                            // אנחנו משדכים את התאריך לשעה רק כדי שהספרייה תדע לפענח את זה, וב-onChange גוזרים חזרה רק את השעה
                            value={`${formData.date || '2026-01-01'}T${formData.fromTime}`}
                            onChange={(val) => setFormData({ ...formData, fromTime: extractTime(val, '00:00') })}
                        />

                        <NpgDatePicker
                            label="עד שעה"
                            showDate={false}
                            showTime={true}
                            value={`${formData.date || '2026-01-01'}T${formData.toTime}`}
                            onChange={(val) => setFormData({ ...formData, toTime: extractTime(val, '23:59') })}
                        />
                    </div>

                    <div className="flex items-center gap-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100 cursor-pointer transition-colors hover:bg-blue-50" onClick={() => setFormData({ ...formData, isWorkDay: !formData.isWorkDay })}>
                        <input type="checkbox" className="w-5 h-5 accent-blue-600 cursor-pointer pointer-events-none" checked={formData.isWorkDay} readOnly />
                        <span className="text-sm font-bold text-blue-800 italic">האם יום עבודה?</span>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border-t flex items-center justify-between px-8">
                    <button onClick={handleSubmit} disabled={isSubmitting} className="bg-blue-600 hover:bg-blue-700 text-white px-12 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2">
                        {isSubmitting ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (isEdit ? "עדכן יום" : "שמור יום חריג")}
                    </button>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-sm transition-colors">ביטול</button>
                </div>
            </div>
        </div>
    );
};