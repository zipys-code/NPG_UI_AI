import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Info, Save, LayoutGrid, AlertCircle, Edit3 } from 'lucide-react';
import { apiRequest } from "@/services/api";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

interface AddEditCalendarModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    editData?: any; // אם קיים, אנחנו במצב עריכה
}

export const AddEditCalendarModal: React.FC<AddEditCalendarModalProps> = ({ isOpen, onClose, onSuccess, editData }) => {
    const { currentNetworkId, currentUser } = useApp();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState({
        calendarName: '',
        description: '',
        profile: ''
    });

    const isEdit = !!editData;

    const getProfileCode = (text: string) => {
        if (!text) return '';
        const cleanText = text.trim();
        if (cleanText === 'נייד') return 'M';
        if (cleanText === 'נייח יחיד') return 'F_S';
        if (cleanText === 'נייח טווח') return 'F_R';
        if (cleanText === 'כללי') return '';
        return cleanText;
    };

    useEffect(() => {
        if (isOpen) {
            if (editData) {
                const rawProfile = editData.profile || editData.PROFILE || "";
                const profileCode = getProfileCode(rawProfile.toString());

                setFormData({
                    calendarName: editData.calendarName || '',
                    description: editData.desc || '', // השארתי desc כפי שהיה במקור שעבד לך
                    profile: profileCode
                });
            } else {
                setFormData({ calendarName: '', description: '', profile: '' });
            }
            setServerError(null);
            setErrors({});
        }
    }, [isOpen, editData]);

    if (!isOpen) return null;

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.calendarName.trim()) newErrors.calendarName = "שדה שם הוא חובה";
        if (!formData.description.trim()) newErrors.description = "שדה תיאור הוא חובה";
        if (!formData.profile) newErrors.profile = "חובה לבחור פרופיל";

        if (isEdit &&
            formData.calendarName === editData.calendarName &&
            formData.description === editData.desc &&
            formData.profile === editData.profile) {
            setServerError("לא בוצע שינוי בנתונים");
            return false;
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;

        const confirmMessage = isEdit
            ? "האם את/ה בטוח שברצונך לעדכן את פרטי היומן?"
            : "האם את/ה בטוח שברצונך להוסיף יומן חדש?";
        if (!window.confirm(confirmMessage)) return;

        setIsSubmitting(true);
        setServerError(null);

        try {
            const payload = {
                setIn: {
                    user: currentUser?.name || "אורח",
                    selfNetworkID: currentNetworkId,
                    action: isEdit ? "UPDATE" : "ADD",
                    data: {
                        calendarId: isEdit ? editData.calendarID : "-1",
                        calendarName: formData.calendarName,
                        desc: formData.description,
                        profile: formData.profile
                    }
                }
            };

            const response = await apiRequest("/AddNewCalendar", payload);
            const getOut = response?.root?.setOut || response?.setOut;
            const notification = getOut?.notification?.msg?.[0];

            if (notification?.code?.toString() === "1000") {
                toast.success(isEdit ? "העדכון בוצע בהצלחה" : "היומן נוסף בהצלחה");
                onSuccess();
                onClose();
            } else {
                setServerError(notification?.msgBody || "ארעה שגיאה בביצוע הפעולה");
            }
        } catch (error) {
            setServerError("שגיאת תקשורת");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" dir="rtl">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col mx-4 border border-slate-200">

                {/* צבע כחול קבוע לכותרת - הוסרה הבדיקה של isEdit לצבע */}
                <div className={`p-5 flex items-center justify-between text-white shadow-md bg-blue-600`}>
                    <div className="flex items-center gap-3">
                        {isEdit ? <Edit3 size={22} /> : <CalendarIcon size={22} />}
                        <h2 className="text-xl font-bold">{isEdit ? "עדכון יומן מערכת" : "הוספת יומן מערכת"}</h2>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-all">
                        <X size={24} />
                    </button>
                </div>

                {serverError && (
                    <div className="mx-8 mt-6 p-4 bg-red-50 border-r-4 border-red-500 rounded-l-lg flex items-center gap-3 text-red-800 animate-in slide-in-from-top-4">
                        <AlertCircle size={20} />
                        <span className="text-sm font-bold">{serverError}</span>
                    </div>
                )}

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <div className="space-y-1">
                            <label className="text-sm font-bold text-slate-600">שם היומן *</label>
                            <input
                                type="text"
                                value={formData.calendarName}
                                onChange={(e) => setFormData({ ...formData, calendarName: e.target.value })}
                                className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition-all ${errors.calendarName ? 'border-red-500 bg-red-50/30' : 'border-slate-200 focus:border-blue-500'}`}
                            />
                            {errors.calendarName && <p className="text-[11px] font-bold text-red-500 mr-1">חובה</p>}
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-bold text-slate-600">סוג פרופיל *</label>
                            <select
                                value={formData.profile}
                                disabled={isEdit && (!editData.profile || editData.profile.trim() === "" || editData.profile === "כללי")}
                                onChange={(e) => setFormData({ ...formData, profile: e.target.value })}
                                className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none transition-all
                                ${isEdit && (!editData.profile || editData.profile === "כללי") ? 'bg-slate-50 cursor-not-allowed text-slate-500' : 'bg-white'} 
                                ${errors.profile ? 'border-red-500 bg-red-50/30' : 'border-slate-200 focus:border-blue-500'}`}
                            >
                                {isEdit && (!editData.profile || editData.profile === "כללי") ? (
                                    <option value="">כללי (יומן מערכת)</option>
                                ) : (
                                    <option value="">בחר...</option>
                                )}
                                <option value="M">נייד</option>
                                <option value="F_S">נייח יחיד</option>
                                <option value="F_R">נייח טווח</option>
                            </select>
                            {errors.profile && <p className="text-[11px] font-bold text-red-500 mr-1">חובה</p>}
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-bold text-slate-600">תיאור *</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className={`w-full border rounded-xl px-4 py-2.5 text-sm outline-none h-28 resize-none ${errors.description ? 'border-red-500 bg-red-50/30' : 'border-slate-200 focus:border-blue-500'}`}
                            />
                            {errors.description && <p className="text-[11px] font-bold text-red-500 mr-1">חובה</p>}
                        </div>
                    </div>

                    {/* תיבת המידע - שינוי לטון כחול במקום אפור/כתום */}
                    {/* <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100 flex flex-col items-center justify-center text-center">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-blue-600 mb-6 shadow-sm border border-blue-100">
                            <LayoutGrid size={32} />
                        </div>
                        <h3 className="font-bold text-blue-800 text-lg mb-4 italic">{isEdit ? "עריכת רשומה" : "שים לב"}</h3>
                        <p className="text-sm text-blue-600/80 leading-relaxed">
                            {isEdit ? "שינוי פרטי היומן ישפיע על כל הגדרות לוחות הזמנים המשוייכות אליו." : "לאחר השמירה, תוכלי להגדיר שעות פתיחה וסגירה בטבלה הראשית."}
                        </p> 
                    </div> */}
                </div>

                <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between px-10">
                    {/* צבע כחול קבוע לכפתור */}
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className={`flex items-center gap-2 text-white px-10 py-3 rounded-xl font-bold text-sm shadow-xl transition-all active:scale-95 disabled:opacity-50 bg-blue-600 hover:bg-blue-700`}
                    >
                        {isSubmitting ? <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={18} /><span>{isEdit ? "עדכן שינויים" : "שמור יומן חדש"}</span></>}
                    </button>
                    <button onClick={onClose} className="text-slate-400 font-bold text-sm px-4 hover:text-slate-600 transition-colors">ביטול</button>
                </div>
            </div>
        </div>
    );
};