import React, { useState, useEffect } from 'react';
import { X, Plus, Save, Hash, Globe, Calendar, XCircle } from 'lucide-react';
import { useApp } from "@/context/AppContext";
import { apiRequest } from "@/services/api";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

export const AddEditNumberingPlanModal = ({ isOpen, onClose, onSuccess, editData }: any) => {
    const { lovs, token, currentNetworkId, currentUser } = useApp();
    const isEdit = !!editData;

    const [formData, setFormData] = useState({
        DNfrom: '',
        DNto: '',
        selectedRHid: '',
        validFrom: format(new Date(), 'yyyy-MM-dd'),
        validTo: '',
        kosherFlag: false,
        tollFreeFlag: false,
        networkType: '' // ריק כברירת מחדל כדי להציג "-בחר רשת-"
    });

    const [errors, setErrors] = useState<any>({});
    const [serverError, setServerError] = useState<string | null>(null);

    // טעינת נתונים (עריכה / חדש)
    useEffect(() => {
        setServerError(null);
        if (isEdit && editData) {
            // מציאת ID מפעיל מה-LOV לפי הטקסט מהגריד
            const operatorEntry = lovs?.byBusiness?.item?.find((item: any) => {
                const label = item.label?.["$"] || item.label || item.displayValue?.["$"] || item.displayValue;
                return label === editData.txtRH;
            });

            // מציאת ID רשת מה-LOV לפי הטקסט מהגריד
            const networkEntry = lovs?.byNetwork?.item?.find((item: any) => {
                const label = item.displayValue?.["$"] || item.displayValue || item.label;
                return label === editData.txtNetworkType;
            });

            const formatDateForInput = (dateStr: string) => {
                if (!dateStr || dateStr === '---' || dateStr === 'null') return '';
                try { return format(parseISO(dateStr.split('/').reverse().join('-')), 'yyyy-MM-dd'); }
                catch (e) { return ''; }
            };

            setFormData({
                DNfrom: editData.txtDNfrom || '',
                DNto: editData.txtDNto || '',
                selectedRHid: operatorEntry ? (operatorEntry.value?.["$"] || operatorEntry.value) : '',
                networkType: networkEntry ? (networkEntry.value?.["$"] || networkEntry.value) : '',
                validFrom: formatDateForInput(editData.txtValidFrom) || format(new Date(), 'yyyy-MM-dd'),
                validTo: formatDateForInput(editData.txtValidTo),
                kosherFlag: String(editData.txtKosherFlag) === 'true' || editData.txtKosherFlag === true,
                tollFreeFlag: String(editData.txtTollFreeFlag) === 'true' || editData.txtTollFreeFlag === true
            });
        } else {
            setFormData({
                DNfrom: '', DNto: '', selectedRHid: '',
                validFrom: format(new Date(), 'yyyy-MM-dd'),
                validTo: '', kosherFlag: false, tollFreeFlag: false, networkType: ''
            });
        }
        setErrors({}); // איפוס שגיאות בפתיחה
    }, [isEdit, editData, isOpen, lovs]);

    // --- לוגיקת הולידציות ששוחזרה ---
    const validate = () => {
        const newErrs: any = {};
        const phoneRegex = /^[0-9]*$/;

        if (!formData.DNfrom) newErrs.DNfrom = "חובה להזין תחילת טווח";
        else if (!phoneRegex.test(formData.DNfrom)) newErrs.DNfrom = "ספרות בלבד";

        if (!formData.DNto) newErrs.DNto = "חובה להזין סוף טווח";
        else if (!phoneRegex.test(formData.DNto)) newErrs.DNto = "ספרות בלבד";

        // תחילת טווח קטן מסוף טווח
        if (!newErrs.DNfrom && !newErrs.DNto && BigInt(formData.DNfrom) > BigInt(formData.DNto)) {
            newErrs.DNto = "סוף הטווח חייב להיות גדול מההתחלה";
        }

        if (!formData.selectedRHid) newErrs.selectedRHid = "חובה לבחור מפעיל";
        if (!formData.networkType) newErrs.networkType = "חובה לבחור רשת";
        if (!formData.validFrom) newErrs.validFrom = "חובה להזין תאריך התחלה";

        // תאריך התחלה קטן מתאריך סיום
        if (formData.validFrom && formData.validTo) {
            if (new Date(formData.validFrom) > new Date(formData.validTo)) {
                newErrs.validTo = "תאריך סיום חייב להיות אחרי התחלה";
            }
        }

        setErrors(newErrs);
        return Object.keys(newErrs).length === 0;
    };

    const handleSave = async () => {
        if (!validate()) return;
        setServerError(null); // איפוס שגיאה קודמת

        const payload = {
            setIn: {
                mode: isEdit ? "INVALIDATE" : "Add",
                user: currentUser?.name || 'משתמש מערכת',
                txtPlanID: editData?.txtPlanID || "",
                DNfrom: formData.DNfrom,
                DNto: formData.DNto,
                selectedRHid: formData.selectedRHid,
                validFrom: format(new Date(formData.validFrom), 'dd/MM/yyyy'),
                validTo: formData.validTo ? format(new Date(formData.validTo), 'dd/MM/yyyy') : "",
                networkType: formData.networkType,
                kosherFlag: formData.kosherFlag ? "true" : "false",
                tollFreeFlag: formData.tollFreeFlag ? "true" : "false",
                token: token,
                selfNetworkID: currentNetworkId
            }
        };

        const response = await apiRequest('/SetNumberingPlan', payload);
        if (response) {
            // חילוץ ההתראה מתוך ה-Response לפי המבנה שרואים בתמונה: setOut -> notification
            const notification = response.setOut?.notification || response.notification;
            const msg = notification?.msg?.[0] || notification?.msg;
            const code = msg?.code?.["$"] || msg?.code;
            const msgBody = msg?.msgBody?.["$"] || msg?.msgBody;

            // רק קוד 1000 נחשב הצלחה אמיתית בטיבקו
            if (code === "1000") {
                toast.success(isEdit ? "הרשומה עודכנה בהצלחה" : "הרשומה נוספה בהצלחה");
                onSuccess();
                onClose();
            } else {
                setServerError(`קוד ${code}: ${msgBody || "שגיאה בביצוע הפעולה"}`);
            }
        }
    };

    if (!isOpen) return null;

    const getFieldClass = (errField: string) => `w-full h-11 bg-slate-50 border rounded-lg px-3 text-sm transition-all ${errors[errField] ? 'border-red-500 ring-1 ring-red-100 bg-red-50' : 'border-slate-200 focus:border-blue-500 focus:bg-white'
        }`;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm rtl" dir="rtl">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl overflow-hidden">
                {/* Header */}
                <div className="bg-[#2563eb] p-4 flex justify-between items-center text-white">
                    <div className="flex items-center gap-2">
                        <Plus size={20} />
                        <h3 className="text-lg font-bold">{isEdit ? "עדכון רשומה קיימת" : "יצירת תוכנית מספור חדשה"}</h3>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors"><X size={20} /></button>
                </div>
                <div className="p-8">
                    {/* הודעת שגיאה מעוצבת לפי הדוגמה שלך */}
                    {serverError && (
                        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-start gap-3">
                                <div className="bg-red-100 p-1.5 rounded-full mt-0.5">
                                    <XCircle size={18} className="text-red-600" />
                                </div>
                                <div className="flex-1">
                                    <h4 className="text-red-800 font-bold text-sm mb-1">שגיאה בביצוע הפעולה:</h4>
                                    <p className="text-red-700 text-[13px] leading-relaxed">
                                        {serverError}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-10">
                        {/* שאר עמודות הטופס... */}
                    </div>
                </div>

                <div className="p-8">
                    <div className="grid grid-cols-3 gap-10">
                        {/* עמודה 1: טווח */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-blue-700 border-b border-slate-100 pb-2 mb-4"><Hash size={18} /><span className="font-bold text-sm">פרטי טווח מספרים</span></div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[12px] font-medium text-slate-500 mb-1">תחילת טווח *</label>
                                    <input type="text" disabled={isEdit} className={getFieldClass('DNfrom')} value={formData.DNfrom} onChange={(e) => setFormData({ ...formData, DNfrom: e.target.value })} />
                                    {errors.DNfrom && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.DNfrom}</p>}
                                </div>
                                <div>
                                    <label className="block text-[12px] font-medium text-slate-500 mb-1">סוף טווח *</label>
                                    <input type="text" disabled={isEdit} className={getFieldClass('DNto')} value={formData.DNto} onChange={(e) => setFormData({ ...formData, DNto: e.target.value })} />
                                    {errors.DNto && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.DNto}</p>}
                                </div>
                            </div>
                        </div>

                        {/* עמודה 2: שיוך */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-blue-700 border-b border-slate-100 pb-2 mb-4"><Globe size={18} /><span className="font-bold text-sm">שיוך רשת ומפעיל</span></div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[12px] font-medium text-slate-500 mb-1">סוג רשת *</label>
                                    <select disabled={isEdit} className={getFieldClass('networkType')} value={formData.networkType} onChange={(e) => setFormData({ ...formData, networkType: e.target.value })}>
                                        <option value="">-בחר רשת-</option>
                                        {(lovs?.byNetwork?.item || []).map((opt: any) => (<option key={opt.value} value={opt.value?.["$"] || opt.value}>{opt.displayValue?.["$"] || opt.displayValue || opt.label}</option>))}
                                    </select>
                                    {errors.networkType && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.networkType}</p>}
                                </div>
                                <div>
                                    <label className="block text-[12px] font-medium text-slate-500 mb-1">מפעיל *</label>
                                    <select disabled={isEdit} className={getFieldClass('selectedRHid')} value={formData.selectedRHid} onChange={(e) => setFormData({ ...formData, selectedRHid: e.target.value })}>
                                        <option value="">-בחר מפעיל-</option>
                                        {(lovs?.byBusiness?.item || []).map((opt: any) => (<option key={opt.value} value={opt.value?.["$"] || opt.value}>{opt.label?.["$"] || opt.label}</option>))}
                                    </select>
                                    {errors.selectedRHid && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.selectedRHid}</p>}
                                </div>
                                <div className="flex flex-col gap-3 pt-2">
                                    <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50/50 cursor-pointer"><input type="checkbox" disabled={isEdit} checked={formData.kosherFlag} onChange={(e) => setFormData({ ...formData, kosherFlag: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-blue-600" /><span className="text-[13px] text-slate-700">מספר כשר</span></label>
                                    <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50/50 cursor-pointer"><input type="checkbox" disabled={isEdit} checked={formData.tollFreeFlag} onChange={(e) => setFormData({ ...formData, tollFreeFlag: e.target.checked })} className="w-4 h-4 rounded border-slate-300 text-blue-600" /><span className="text-[13px] text-slate-700">מספר חופשי (Toll Free)</span></label>
                                </div>
                            </div>
                        </div>

                        {/* עמודה 3: זמנים */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 text-blue-700 border-b border-slate-100 pb-2 mb-4"><Calendar size={18} /><span className="font-bold text-sm">לוחות זמנים</span></div>
                            <div className="space-y-4">
                                <div><label className="block text-[12px] font-medium text-slate-500 mb-1">תקף מתאריך *</label>
                                    <input type="date" disabled={isEdit} className={getFieldClass('validFrom')} value={formData.validFrom} onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })} />
                                    {errors.validFrom && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.validFrom}</p>}</div>
                                <div><label className="block text-[12px] font-medium text-slate-500 mb-1">בתוקף עד</label>
                                    <input type="date" className={getFieldClass('validTo')} value={formData.validTo} onChange={(e) => setFormData({ ...formData, validTo: e.target.value })} />
                                    {errors.validTo && <p className="text-red-500 text-[10px] mt-1 font-bold">{errors.validTo}</p>}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-50/80 p-6 flex items-center gap-4">
                    <button onClick={handleSave} className="bg-[#2563eb] text-white px-8 py-2.5 rounded-lg font-bold text-sm shadow-lg hover:bg-blue-700 flex items-center gap-2 transition-all active:scale-95"><Save size={18} />{isEdit ? "עדכן רשומה" : "הוסף תוכנית"}</button>
                    <button onClick={onClose} className="text-slate-600 font-bold text-sm hover:text-slate-800 px-4">ביטול</button>
                </div>
            </div>
        </div>
    );
};