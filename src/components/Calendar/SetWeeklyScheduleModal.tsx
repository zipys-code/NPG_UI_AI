import React, { useState, useEffect } from 'react';
import { X, Clock, Save, AlertCircle } from 'lucide-react';
import { apiRequest } from "@/services/api";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

interface SetWeeklyScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    calendarId: string;
    editData?: any; // אם קיים, אנחנו בעריכה
}

export const SetWeeklyScheduleModal: React.FC<SetWeeklyScheduleModalProps> = ({ isOpen, onClose, onSuccess, calendarId, editData }) => {
    const { currentNetworkId, currentUser, token } = useApp();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        day: '1',
        fromHour: '00',
        fromMinute: '00',
        toHour: '23',
        toMinute: '59'
    });

    const dayNameToCode: Record<string, string> = {
        "ראשון": "1", "שני": "2", "שלישי": "3", "רביעי": "4",
        "חמישי": "5", "שישי": "6", "שבת": "7"
    };

    const isEdit = !!editData;

    useEffect(() => {
        if (isOpen) {
            if (isEdit && editData) {

                const rawDay = editData.day?.toString().trim();
                const dayFromMap = dayNameToCode[rawDay];
                const finalDay = dayFromMap || (['1', '2', '3', '4', '5', '6', '7'].includes(rawDay) ? rawDay : '1');

                // פירוק שעות בפורמט HH:mm
                const [fH, fM] = (editData.SoBH || "00:00").split(':');
                const [tH, tM] = (editData.EoBH || "23:59").split(':');
                setFormData({
                    day: finalDay,
                    fromHour: fH, fromMinute: fM,
                    toHour: tH, toMinute: tM
                });
            } else {
                setFormData({ day: '1', fromHour: '00', fromMinute: '00', toHour: '23', toMinute: '59' });
            }
            setServerError(null);
        }
    },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [isOpen, editData]);

    const validate = () => {
        // ולידציה: שעת התחלה חייבת להיות לפני שעת סיום
        const start = Number(formData.fromHour) * 60 + Number(formData.fromMinute);
        const end = Number(formData.toHour) * 60 + Number(formData.toMinute);

        if (start >= end) {
            setServerError("שעת התחלה חייבת להיות מוקדמת משעת סיום");
            return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        setServerError(null); // איפוס שגיאה לפני שליחה
        if (!validate()) return;

        const confirmMessage = isEdit ? "האם את/ה בטוח שברצונך לעדכן את שעות הפעילות?"
            : "האם את/ה בטוח שברצונך להוסיף שעות עבודה?";

        // 3. הצגת חלונית ה-confirm ועצירה במידה והמשתמש ביטל
        if (!window.confirm(confirmMessage)) return;
        setIsSubmitting(true);

        const payload = {
            setIn: {
                mode: isEdit ? "MODIFY_WEEK_DAY" : "ADD_WEEK_DAY",
                calendarId: calendarId,
                weeklySchedularId: isEdit ? editData.weeklyScheduleID : "-1",
                day: formData.day,
                SoBH: `${formData.fromHour}:${formData.fromMinute}`,
                EoBH: `${formData.toHour}:${formData.toMinute}`,
                token: token,
                selfNetworkID: currentNetworkId,
                user: currentUser?.name || "מערכת"
            }
        };

        try {
            const response = await apiRequest("/SetWeeklySchedule", payload);
            const notification = response?.setOut?.notification?.msg?.[0];

            if (notification?.code === "1000") {
                toast.success("השעות עודכנו בהצלחה");
                onSuccess();
                onClose();
            } else {
                setServerError(notification?.msgBody || "ארעה שגיאה בביצוע הפעולה");
            }
        } catch (error) {
            setServerError("שגיאת תקשורת מול השרת");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutes = ["00", "15", "30", "45", "59"];

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 rtl" dir="rtl">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200 animate-in fade-in zoom-in duration-200">
                <div className="bg-blue-600 p-5 flex justify-between items-center text-white">
                    <div className="flex items-center gap-3">
                        <Clock size={22} />
                        <h2 className="text-lg font-bold">{isEdit ? "עדכון שעות עבודה" : "הוספת שעות עבודה"}</h2>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/20 p-1.5 rounded-full transition-colors"><X size={20} /></button>
                </div>

                <div className="p-8 space-y-6">
                    {serverError && (
                        <div className="p-3 bg-red-50 border-r-4 border-red-500 text-red-700 text-xs font-bold flex items-center gap-2">
                            <AlertCircle size={16} /> {serverError}
                        </div>
                    )}

                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">יום בשבוע *</label>
                            <select
                                disabled={isEdit}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 disabled:opacity-60"
                                value={formData.day}
                                onChange={(e) => setFormData({ ...formData, day: e.target.value })}
                            >
                                <option value="1">ראשון</option>
                                <option value="2">שני</option>
                                <option value="3">שלישי</option>
                                <option value="4">רביעי</option>
                                <option value="5">חמישי</option>
                                <option value="6">שישי</option>
                                <option value="7">שבת</option>
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">משעה</label>
                                <div className="flex gap-1">
                                    <select className="flex-1 border rounded-lg p-2 text-sm" value={formData.fromMinute} onChange={(e) => setFormData({ ...formData, fromMinute: e.target.value })}>{minutes.map(m => <option key={m} value={m}>{m}</option>)}</select>
                                    <select className="flex-1 border rounded-lg p-2 text-sm" value={formData.fromHour} onChange={(e) => setFormData({ ...formData, fromHour: e.target.value })}>{hours.map(h => <option key={h} value={h}>{h}</option>)}</select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">עד שעה</label>
                                <div className="flex gap-1">
                                    <select className="flex-1 border rounded-lg p-2 text-sm" value={formData.toMinute} onChange={(e) => setFormData({ ...formData, toMinute: e.target.value })}>{minutes.map(m => <option key={m} value={m}>{m}</option>)}</select>
                                    <select className="flex-1 border rounded-lg p-2 text-sm" value={formData.toHour} onChange={(e) => setFormData({ ...formData, toHour: e.target.value })}>{hours.map(h => <option key={h} value={h}>{h}</option>)}</select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border-t flex items-center justify-between">
                    <button onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-xl font-bold text-sm shadow-lg disabled:opacity-50 transition-all active:scale-95">
                        {isSubmitting ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={18} /><span>{isEdit ? "עדכן" : "הוסף"}</span></>}
                    </button>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-sm">ביטול</button>
                </div>
            </div>
        </div>
    );
};