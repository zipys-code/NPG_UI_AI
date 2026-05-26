import React, { useState, useEffect } from 'react';
import { X, Building2, User, Mail, Phone, AlertCircle, Save } from 'lucide-react';

interface SetOperatorModalProps {
    isOpen: boolean;
    onClose: () => void;
    operatorData?: any; // אם קיים - אנחנו במצב עריכה
    existingOperators: any[]; // לצורך ולידציה של כפילויות
    onConfirm: (data: any) => void;
    loading: boolean;
    serverError?: string | null;
}

export const SetOperatorModal = ({
    isOpen, onClose, operatorData, existingOperators, onConfirm, loading, serverError
}: SetOperatorModalProps) => {

    // ניהול הסטייט של השדות
    const [formData, setFormData] = useState({
        BusinessName: '',
        BusinessContactName: '',
        BusinessEmailAddress: '',
        BusinessPhoneNumber: ''
    });

    // ניהול שגיאות ולידציה
    const [errors, setErrors] = useState<Record<string, string>>({});

    // אתחול נתונים בעת פתיחה (עריכה או חדש)
    useEffect(() => {
        if (isOpen) {
            if (operatorData) {
                setFormData({
                    BusinessName: operatorData.BusinessName || '',
                    BusinessContactName: operatorData.ContactName || '',
                    BusinessEmailAddress: operatorData.EmailAddress || '',
                    BusinessPhoneNumber: operatorData.PhoneNumber || ''
                });
            } else {
                setFormData({ BusinessName: '', BusinessContactName: '', BusinessEmailAddress: '', BusinessPhoneNumber: '' });
            }
            setErrors({});
        }
    }, [isOpen, operatorData]);

    if (!isOpen) return null;

    const isEdit = !!operatorData;

    const validate = () => {
        const newErrors: Record<string, string> = {};

        // רגקס לאימייל (בודק מבנה של name@domain.com)
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        // רגקס לטלפון (תומך בפורמט ישראלי: 05X-XXXXXXX או 0X-XXXXXXX, עם או בלי מקף)
        const phoneRegex = /^(?:0(?:[23489]|[57]\d)\-?\d{7})$/;

        // --- ולידציות שדות חובה (כפי שהיה) ---
        if (!formData.BusinessName.trim()) newErrors.BusinessName = "חובה להזין שם מפעיל";
        if (!formData.BusinessContactName.trim()) newErrors.BusinessContactName = "חובה להזין שם איש קשר";

        // --- ולידציית אימייל ---
        if (!formData.BusinessEmailAddress.trim()) {
            newErrors.BusinessEmailAddress = "חובה להזין כתובת אימייל";
        } else if (!emailRegex.test(formData.BusinessEmailAddress)) {
            newErrors.BusinessEmailAddress = "כתובת האימייל אינה תקינה (לדוגמה: name@mail.com)";
        }

        // --- ולידציית טלפון ---
        if (!formData.BusinessPhoneNumber.trim()) {
            newErrors.BusinessPhoneNumber = "חובה להזין מספר טלפון";
        } else if (!phoneRegex.test(formData.BusinessPhoneNumber.replace(/-/g, ''))) {
            newErrors.BusinessPhoneNumber = "מספר הטלפון אינו תקין (10 ספרות, לדוגמה: 0501234567)";
        }

        // ולידציה: שם מפעיל קיים (רק בהוספה)
        if (!isEdit) {
            const exists = existingOperators.some(op =>
                op.BusinessName?.trim().toLowerCase() === formData.BusinessName.trim().toLowerCase()
            );
            if (exists) newErrors.BusinessName = "מפעיל בשם זה כבר קיים במערכת";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;

        const confirmMsg = isEdit ? "האם לעדכן את פרטי המפעיל?" : "האם להוסיף מפעיל חדש?";
        if (window.confirm(confirmMsg)) {
            onConfirm({
                ...formData,
                BusinessId: isEdit ? operatorData.BusinessId : "-1",
                mode: isEdit ? "Modify" : "Add"
            });
        }
    };

    const inputClass = (fieldName: string) => `
        w-full border rounded-xl p-2.5 text-xs outline-none transition-all
        ${errors[fieldName] ? 'border-red-500 bg-red-50 focus:ring-1 focus:ring-red-200' : 'border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-100'}
    `;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4" dir="rtl">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-blue-600 px-6 py-4 flex justify-between items-center text-white shrink-0">
                    <div className="flex items-center gap-2">
                        <Building2 size={20} />
                        <h3 className="font-bold text-base">{isEdit ? `עריכת מפעיל: ${operatorData.BusinessName}` : 'הוספת מפעיל חדש'}</h3>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* שגיאת שרת */}
                    {serverError && (
                        <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-red-800 text-[11px] font-bold flex items-center gap-2 animate-in shake-in">
                            <AlertCircle size={16} />
                            {serverError}
                        </div>
                    )}

                    {/* שם מפעיל */}
                    <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1">שם מפעיל *</label>
                        <input
                            type="text"
                            className={inputClass('BusinessName')}
                            value={formData.BusinessName}
                            onChange={(e) => setFormData({ ...formData, BusinessName: e.target.value })}
                        />
                        {errors.BusinessName && <p className="text-[10px] text-red-500 font-bold">{errors.BusinessName}</p>}
                    </div>

                    {/* איש קשר */}
                    <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1">שם איש קשר *</label>
                        <div className="relative">
                            <User size={14} className="absolute left-3 top-3 text-slate-400" />
                            <input
                                type="text"
                                className={inputClass('BusinessContactName')}
                                value={formData.BusinessContactName}
                                onChange={(e) => setFormData({ ...formData, BusinessContactName: e.target.value })}
                            />
                        </div>
                        {errors.BusinessContactName && <p className="text-[10px] text-red-500 font-bold">{errors.BusinessContactName}</p>}
                    </div>

                    {/* אימייל וטלפון - שורה אחת */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1">אימייל *</label>
                            <div className="relative">
                                <Mail size={14} className="absolute left-3 top-3 text-slate-400" />
                                <input
                                    type="email"
                                    className={inputClass('BusinessEmailAddress')}
                                    value={formData.BusinessEmailAddress}
                                    onChange={(e) => setFormData({ ...formData, BusinessEmailAddress: e.target.value })}
                                />
                            </div>
                            {errors.BusinessEmailAddress && <p className="text-[10px] text-red-500 font-bold">{errors.BusinessEmailAddress}</p>}
                        </div>

                        <div className="space-y-1">
                            <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1">טלפון *</label>
                            <div className="relative">
                                <Phone size={14} className="absolute left-3 top-3 text-slate-400" />
                                <input
                                    type="tel"
                                    className={inputClass('BusinessPhoneNumber')}
                                    value={formData.BusinessPhoneNumber}
                                    onChange={(e) => setFormData({ ...formData, BusinessPhoneNumber: e.target.value })}
                                />
                            </div>
                            {errors.BusinessPhoneNumber && <p className="text-[10px] text-red-500 font-bold">{errors.BusinessPhoneNumber}</p>}
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-4 bg-slate-50 border-t flex gap-3">
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                        {isEdit ? 'עדכן מפעיל' : 'הוסף מפעיל'}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 text-slate-500 font-bold text-sm hover:bg-slate-100 rounded-xl transition-all"
                    >
                        ביטול
                    </button>
                </div>
            </div>
        </div>
    );
};