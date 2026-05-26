import React, { useState, useEffect } from 'react';
import { X, Settings, Calendar, Info, Send } from 'lucide-react';
import { useApp } from "@/context/AppContext";
import { apiRequest } from "@/services/api";
import { toast } from "sonner";

interface AddEditTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    mode: 'add' | 'edit';
    initialData?: any;
    actionTypes: any[];
    onSuccess: () => void;
}

const unitMapping: Record<string, string> = {
    'דקות': 'MINUTES',
    'שעות': 'HOURS',
    'ימים': 'DAYS',
    'שבועות': 'WEEKS',
    'חודשים': 'MONTHS',
};



export const AddEditTaskModal = ({ isOpen, onClose, mode, initialData, actionTypes, onSuccess }: AddEditTaskModalProps) => {
    const { currentNetworkId, currentUser, token } = useApp();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        taskDesc: '',
        actionTypeID: '',
        params: {} as Record<string, string>,
        scheduleType: 'בתאריך',
        startDate: new Date().toISOString().split('T')[0],
        startTime: '12:00',
        repeatInterval: '01',
        repeatUnit: 'שבועות'
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen && mode === 'edit' && initialData) {
            // 1. מיפוי הפוך מאנגלית לעברית עבור ה-Select
            const reverseUnitMapping: Record<string, string> = {
                'MINUTES': 'דקות',
                'HOURS': 'שעות',
                'DAYS': 'ימים',
                'WEEKS': 'שבועות',
                'MONTHS': 'חודשים'
            };

            // 2. פירוק ה-CSV של הפרמטרים (הפסיקים)
            const existingParams: Record<string, string> = {};
            const actionDef = actionTypes.find(at => at.actionTypeID === initialData.actionTypeId);

            if (actionDef && initialData.actionParams) {
                const valuesArray = initialData.actionParams.split(',');
                const rows = actionDef.actionParams?.row || [];
                const rowsArray = Array.isArray(rows) ? rows : [rows];

                rowsArray.forEach((row: any, index: number) => {
                    if (valuesArray[index] !== undefined) {
                        existingParams[row.paramName] = valuesArray[index].trim();
                    }
                });
            }

            // 3. חילוץ תאריך ושעה
            const [datePart, timePart] = (initialData.startActivationDate || "").split(' ');
            const formattedDate = datePart && datePart.includes('/')
                ? datePart.split('/').reverse().join('-')
                : new Date().toISOString().split('T')[0];

            // 4. קביעת היחידה לתצוגה (חשוב!)
            const rawUnit = initialData.repeatTimeUnit; // מגיע מהשרת כ-WEEKS
            const displayUnit = initialData.activationMode === 'חד פעמי'
                ? 'פעם אחת'
                : (reverseUnitMapping[rawUnit] || rawUnit || 'שבועות');

            setFormData({
                taskDesc: initialData.taskDesc || initialData.activationName || '',
                actionTypeID: initialData.actionTypeId || '',
                params: existingParams,
                scheduleType: initialData.activationMode === 'בעליה' ? 'בעליה' : 'בתאריך',
                startDate: formattedDate,
                startTime: timePart || '12:00',
                repeatInterval: initialData.repeatTimeInterval || '01',
                repeatUnit: displayUnit // עכשיו זה יהיה "שבועות" וה-Select יזהה אותו!
            });
        } else if (isOpen && mode === 'add') {
            // איפוס להוספה
            setFormData({
                taskDesc: '', actionTypeID: '', params: {},
                scheduleType: 'בתאריך', startDate: new Date().toISOString().split('T')[0],
                startTime: '12:00', repeatInterval: '01', repeatUnit: 'שבועות'
            });
        }
    }, [isOpen, initialData, mode, actionTypes]);

    const handleActionTypeChange = (typeId: string) => {
        // עכשיו actionTypes מכיל את הנתונים המוצלבים שבנינו למעלה
        const selectedAction = actionTypes.find((at: any) => at.actionTypeID === typeId);

        console.log("Selected Action Object:", selectedAction);

        const newParams: Record<string, string> = {};
        if (selectedAction?.actionParams?.row) {
            const rows = selectedAction.actionParams.row;
            rows.forEach((p: any) => {
                newParams[p.paramName] = p.paramValue || "";
            });
        }

        setFormData(prev => ({
            ...prev,
            actionTypeID: typeId,
            params: newParams
        }));
    };

    const updateParam = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, params: { ...prev.params, [name]: value } }));
    };

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        const now = new Date();
        const selectedDateTime = new Date(`${formData.startDate}T${formData.startTime}`);

        // 1. ולידציה על תיאור משימה
        if (!formData.taskDesc.trim()) {
            newErrors.taskDesc = "חובה להזין תיאור משימה";
        }

        // 2. ולידציה על שם פעולה
        if (!formData.actionTypeID || formData.actionTypeID === "" || formData.actionTypeID === "select") {
            newErrors.actionTypeID = "חובה לבחור סוג פעולה";
        }

        // 3. ולידציה על תאריך (רק אם נבחר 'בתאריך')
        if (formData.scheduleType === 'בתאריך') {
            if (selectedDateTime < now) {
                newErrors.startDate = "לא ניתן לבחור מועד התחלה בעבר";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0; // מחזיר true אם אין שגיאות
    };

    const handleSubmit = async () => {
        if (!validateForm()) return; // עצירה אם יש שגיאות ולידציה
        setIsSubmitting(true);

        const isOnce = formData.repeatUnit === 'פעם אחת';
        const isStartUp = formData.scheduleType === 'בעליה'; // זיהוי מצב בעלייה
        const isImmediate = formData.scheduleType === 'מיידי';
        const shouldSendEmptyRepeat = isImmediate || isStartUp || isOnce;

        // א. הכנת רשימת הפרמטרים במבנה row
        const paramRows = Object.entries(formData.params).map(([name, value]) => ({
            paramName: name,
            paramValue: value
        }));

        const getScheduledType = () => {
            if (formData.scheduleType === 'מיידי') return 'immediate';
            if (formData.scheduleType === 'בעליה') return 'startUp';
            return 'date'; // עבור "בתאריך"
        };

        // ב. בניית ה-Payload לפי ה-XSD ששלחת
        const payload = {
            setIn: {
                token: token,
                user: currentUser?.name || "אורח",
                selfNetworkID: currentNetworkId,
                data: {
                    mode: mode.toUpperCase(), // "ADD" או "EDIT" (או מה שהשרת מצפה ב-mode)
                    taskID: mode === 'edit' ? initialData.taskID : "-1",
                    taskDesc: formData.taskDesc,
                    actionParamList: {
                        actionTypeID: formData.actionTypeID,
                        row: paramRows
                    },
                    taskDateTime: {
                        selectedValue: getScheduledType(),
                        // המרה לפורמט dd/mm/yyyy אם השרת דורש, או השארת yyyy-mm-dd
                        date: formData.startDate.split('-').reverse().join('/'),
                        time: formData.startTime
                    },
                    repeatTime: {
                        repeatInterval: shouldSendEmptyRepeat ? "-1" : formData.repeatInterval,
                        repeatTimeUnit: shouldSendEmptyRepeat ? "-1" : (unitMapping[formData.repeatUnit] || formData.repeatUnit)
                    },

                    byStartFlag: formData.scheduleType === 'בעליה' ? 'true' : 'false'
                }
            }
        };

        try {
            console.log("Sending Payload:", payload);
            const response = await apiRequest("/SetHousekeepingScheduler", payload);

            // בדיקת הצלחה לפי msgCode (בדרך כלל 1000)
            const notification = response?.setOut?.notification?.msg?.[0];
            if (notification?.msgCode === "1000") {
                toast.success(mode === 'add' ? "המשימה נוספה בהצלחה" : "המשימה עודכנה בהצלחה");
                onClose(); // סגירת המודאל
                onSuccess();
            } else {
                toast.error(notification?.msgBody || "ארעה שגיאה בשמירת הנתונים");
            }
        } catch (error) {
            console.error("Submit Error:", error);
            toast.error("שגיאת תקשורת מול השרת");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 backdrop-blur-[1px] p-4 rtl" dir="rtl">
            {/* הרחבנו את המודאל ל-max-w-3xl כדי שהשדות לא יצאו מהמסגרת */}
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">

                {/* Header - bg-blue-600 כבקשתך */}
                <div className="bg-blue-600 px-6 py-4 flex justify-between items-center text-white shrink-0 shadow-md">
                    <div className="flex items-center gap-3">
                        <Settings size={20} />
                        <h2 className="text-base font-bold">
                            {mode === 'add' ? 'הוספת משימה חדשה' : 'עריכת משימה'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors p-1">
                        <X size={22} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-6 bg-[#fcfcfc] max-h-[60vh]">

                    {/* Task Details Frame */}
                    <div className="space-y-4 p-5 bg-white rounded-2xl border border-slate-100 shadow-sm relative pt-6">
                        <div className="absolute top-0 right-6 -translate-y-1/2 bg-white px-2 text-[10px] font-black text-blue-600 uppercase tracking-widest border border-slate-100 rounded-full">
                            פרטי משימה
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex flex-col gap-1 flex-1">
                                <label className="text-[11px] font-bold text-slate-500">תאור משימה:*</label>
                                <input
                                    type="text"
                                    value={formData.taskDesc}
                                    readOnly={mode === 'edit'}
                                    onChange={(e) => {
                                        setFormData({ ...formData, taskDesc: e.target.value });
                                        if (errors.taskDesc) setErrors({ ...errors, taskDesc: '' }); // ניקוי שגיאה בזמן הקלדה
                                    }}
                                    /* className={`border rounded px-2 py-1.5 text-xs outline-none transition-all ${errors.taskDesc ? 'border-red-500 bg-red-50/30' : 'border-slate-200 focus:border-blue-600'
                                        }`} */
                                    className={`border rounded px-2 py-1.5 text-xs outline-none transition-all 
                                            ${errors.taskDesc ? 'border-red-500 bg-red-50/30' : 'border-slate-200 focus:border-blue-600'} 
                                            ${mode === 'edit' ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}`}
                                />
                                {errors.taskDesc && <span className="text-[10px] text-red-500 font-bold">{errors.taskDesc}</span>}
                            </div>
                            <div className="flex flex-col gap-1 flex-1">
                                <label className="text-[11px] font-bold text-slate-500 w-20 shrink-0">שם פעולה:*</label>
                                <select
                                    value={formData.actionTypeID}
                                    disabled={mode === 'edit'}
                                    onChange={(e) => {
                                        handleActionTypeChange(e.target.value);
                                        if (errors.actionTypeID) setErrors({ ...errors, actionTypeID: "" });
                                    }}
                                    /* className={`border rounded px-2 py-1.5 text-xs outline-none bg-white cursor-pointer font-medium transition-all ${errors.actionTypeID ? 'border-red-500 bg-red-50/30' : 'border-slate-200 focus:border-blue-600'
                                        }`} */
                                    className={`border rounded px-2 py-1.5 text-xs outline-none transition-all 
                                            ${errors.taskDesc ? 'border-red-500 bg-red-50/30' : 'border-slate-200 focus:border-blue-600'} 
                                            ${mode === 'edit' ? 'bg-slate-100 cursor-not-allowed' : 'bg-white'}`}
                                >
                                    <option value="">-- בחר --</option>
                                    {actionTypes.map((type: any) => (
                                        <option key={type.actionTypeID} value={type.actionTypeID}>
                                            {type.actionTypeDesc || type.actionTypeID}
                                        </option>
                                    ))}
                                </select>
                                {errors.actionTypeID && <span className="text-[10px] text-red-500 font-bold">{errors.actionTypeID}</span>}
                            </div>
                        </div>

                        {/* Dynamic Parameters Grid */}
                        {Object.keys(formData.params).length > 0 && (
                            <div className="mt-2 border rounded-xl overflow-hidden border-slate-100 bg-slate-50/20 shadow-inner">
                                <table className="w-full text-right">
                                    <thead className="bg-slate-50 text-slate-400 font-bold text-[10px] uppercase border-b">
                                        <tr><th className="p-2 pr-4">משתנה</th><th className="p-2 w-1/2 text-center">ערך</th></tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {Object.entries(formData.params).map(([key, val]) => (
                                            <tr key={key}>
                                                <td className="p-2 pr-4 text-[11px] font-bold text-slate-600">{key}</td>
                                                <td className="p-2">
                                                    <input
                                                        type="text"
                                                        value={val}
                                                        onChange={(e) => updateParam(key, e.target.value)}
                                                        className="w-full border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:bg-white focus:border-blue-600 transition-all text-blue-700 font-bold"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Scheduling Frame */}
                    <div className="p-5 bg-white rounded-2xl border border-slate-100 shadow-sm space-y-5 relative pt-6">
                        <div className="absolute top-0 right-6 -translate-y-1/2 bg-white px-2 text-[10px] font-black text-blue-600 uppercase tracking-widest border border-slate-100 rounded-full">
                            תיזמון
                        </div>

                        <div className="flex flex-wrap items-center gap-6">
                            <div className="flex items-center gap-3">
                                <label className="text-[11px] font-bold text-slate-500 w-20 shrink-0">מועד התחלה:*</label>
                                <select
                                    value={formData.scheduleType}
                                    onChange={(e) => setFormData({ ...formData, scheduleType: e.target.value })}
                                    className="border border-slate-200 rounded px-2 py-1.5 text-xs outline-none focus:border-blue-600 w-32 bg-white font-medium"
                                >
                                    <option value="מיידי">מיידי</option>
                                    <option value="בתאריך">בתאריך</option>
                                    <option value="בעליה">בעליה</option>
                                </select>
                            </div>

                            {formData.scheduleType === 'בתאריך' && (
                                <div className="flex items-center gap-3 animate-in fade-in slide-in-from-right-2">
                                    <div className="flex flex-col gap-1">
                                        <input
                                            type="date"
                                            className={`border rounded px-2 py-1.5 text-xs w-36 outline-none ${errors.startDate ? 'border-red-500 bg-red-50/30' : 'border-slate-200 focus:border-blue-600'
                                                }`}
                                            value={formData.startDate}
                                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        />
                                        {errors.startDate && <span className="text-[10px] text-red-500 font-bold max-w-[150px]">{errors.startDate}</span>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="time"
                                            className="border border-slate-200 rounded px-2 py-1.5 text-xs w-24 outline-none focus:border-blue-600 font-medium text-center"
                                            value={formData.startTime}
                                            onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        {formData.scheduleType === 'בתאריך' && (
                            <div className="pt-4 border-t border-slate-50 space-y-4">
                                <div className="flex items-center gap-3">
                                    <label className="text-[11px] font-bold text-slate-500 w-20">ביצוע כל:*</label>
                                    <div className="flex gap-2">
                                        {/* הצגה מותנית של שדה המספר - מוסתר אם נבחר "פעם אחת" */}
                                        {formData.repeatUnit !== 'פעם אחת' && (
                                            <input
                                                type="number"
                                                min="1"
                                                className={`w-16 border rounded px-2 py-1.5 text-xs text-center outline-none transition-all ${errors.repeatInterval ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-blue-600'
                                                    }`}
                                                value={formData.repeatInterval}
                                                onChange={(e) => setFormData({ ...formData, repeatInterval: e.target.value })}
                                            />
                                        )}
                                        <select
                                            className="border border-slate-200 rounded px-2 py-1.5 text-xs outline-none focus:border-blue-600 bg-white font-medium w-32"
                                            value={formData.repeatUnit}
                                            onChange={(e) => {
                                                const unit = e.target.value;
                                                // עדכון ה-unit ואיפוס ה-interval ל-'0' אם זה חד פעמי
                                                setFormData({
                                                    ...formData,
                                                    repeatUnit: unit,
                                                    repeatInterval: unit === 'פעם אחת' ? '0' : '01'
                                                });
                                            }}
                                        >
                                            <option value="פעם אחת">פעם אחת</option>
                                            <option value="דקות">דקות</option>
                                            <option value="שעות">שעות</option>
                                            <option value="ימים">ימים</option>
                                            <option value="שבועות">שבועות</option>
                                            <option value="חודשים">חודשים</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center gap-2 text-blue-700 text-[10px] font-bold italic shadow-sm">
                                    <Info size={14} className="shrink-0" />
                                    <span>
                                        בתאריך {formData.startDate.split('-').reverse().join('/')} שעה {formData.startTime}
                                        {formData.repeatUnit === 'פעם אחת'
                                            ? ' לביצוע חד פעמי'
                                            : ` כל ${formData.repeatInterval} ${formData.repeatUnit}`
                                        }
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 bg-slate-50 border-t flex items-center justify-between shrink-0 px-8">
                    <button
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-10 py-2.5 rounded-xl font-bold text-sm shadow-lg transition-all active:scale-95"
                        onClick={() => {
                            if (validateForm()) {
                                handleSubmit();
                            }
                        }}
                    >
                        <Send size={18} />
                        <span>{mode === 'add' ? 'צור משימה' : 'עדכן משימה'}</span>
                    </button>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-xs transition-colors">
                        ביטול
                    </button>
                </div>
            </div>
        </div>
    );
};