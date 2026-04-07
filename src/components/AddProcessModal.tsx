import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, Phone, User, Calendar, Network, Plus } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';

// הגדרת טיפוס למפעיל ברשת
interface NetworkOption {
    value: string;
    display: string;
    networkType?: string;
}

export const AddProcessModal = ({ isOpen, onClose, onSave }: { isOpen: boolean, onClose: () => void, onSave: (data: any) => void }) => {
    // 1. Hooks - תמיד בראש הקומפוננטה (אסור לשים IF מעליהם!)
    const { lovs, currentNetworkId } = useApp();
    const [errors, setErrors] = useState<Record<string, string>>({});

    const getInitialTimes = (offsetMin: number) => {
        const d = new Date();
        d.setMinutes(d.getMinutes() + offsetMin);
        return d.toTimeString().substring(0, 5);
    };

    const [form, setForm] = useState({
        dnNumber: '',
        processType: 'MNPP-1',
        networkType: 'M',
        customerProfile: 'I',
        activationType: 'NEW',
        newDonor: '',
        crmOrderNum: '',
        contractId: '',
        billCustomerId: '',
        crmCustomerId: '',
        customerId1: '',
        customerId2: '',
        customerId3: '',
        prepaid: 'N',
        portedDate: new Date().toLocaleDateString('en-CA'),
        portedTime: getInitialTimes(10),
        execDate: new Date().toLocaleDateString('en-CA'),
        execTime: getInitialTimes(20)
    });

    // 2. פונקציית עזר לחילוץ נתונים מה-LOV
    const getOptionsFromLOV = (categoryKey: string): NetworkOption[] => {
        const group = lovs?.[categoryKey];
        const items = group?.item || group;
        if (!items || !Array.isArray(items)) return [];

        return items.map(opt => ({
            value: String(opt.value || ''),
            display: String(opt.label || opt.display || opt.value || ''),
            // התיקון הקריטי: התאמה לאיות aditinalData1 מהשרת שלך
            networkType: opt.aditinalData1
        }));
    };

    // 3. משתנים מחושבים (סינון מפעילים)
    const allNetworks = useMemo(() => getOptionsFromLOV('byBusiness'), [lovs]);

    const filteredOperators = useMemo(() =>
        allNetworks.filter((op: NetworkOption) =>
            !form.networkType || op.networkType === form.networkType
        )
        , [allNetworks, form.networkType]);

    // 4. לוגיקת ברירת מחדל חכמה (זיהוי הוט כנייח - F)
    useEffect(() => {
        if (isOpen && currentNetworkId && allNetworks.length > 0) {
            const currentOp = allNetworks.find(op => String(op.value) === String(currentNetworkId));

            if (currentOp && currentOp.networkType) {
                setForm(prev => ({ ...prev, networkType: currentOp.networkType! }));
            }
        }
    }, [isOpen, currentNetworkId, allNetworks]);

    // 5. ניהול שמירה וולידציה
    const validateAndSave = () => {
        const newErrors: Record<string, string> = {};

        if (!form.dnNumber) newErrors.dnNumber = "חובה להזין מספר טלפון";
        if (!form.newDonor) newErrors.newDonor = "חובה לבחור מפעיל ננטש";
        if (!form.contractId) newErrors.contractId = "חובה להזין מספר חוזה";
        if (!form.crmOrderNum) newErrors.crmOrderNum = "חובה להזין מס' הזמנת CRM";

        if (form.customerProfile === 'I' && !form.customerId1 && !form.customerId2 && !form.customerId3) {
            newErrors.customerId1 = "בלקוח מזוהה חובה להזין לפחות מזהה אחד";
        }

        setErrors(newErrors);
        if (Object.keys(newErrors).length === 0) {
            onSave(form);
        }
    };

    // 6. תנאי יציאה מוקדם - רק עכשיו מותר
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" dir="rtl">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl border border-slate-200 flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 bg-blue-600 text-white rounded-t-2xl">
                    <div className="flex items-center gap-2">
                        <Plus size={20} />
                        <h3 className="font-bold text-lg">יצירת תהליך ניוד חדש</h3>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full"><X size={20} /></button>
                </div>

                <div className="p-8 overflow-y-auto grid grid-cols-3 gap-8 text-right">

                    {/* עמודה 1: פרטי מנוי ורשת */}
                    <section className="space-y-4">
                        <h4 className="font-bold text-blue-700 border-b pb-2 flex items-center gap-2"><Network size={16} /> פרטי מנוי ורשת</h4>
                        <Field label="מספר לניוד *" value={form.dnNumber} error={errors.dnNumber} onChange={v => setForm({ ...form, dnNumber: v })} />
                        <SelectField label="סוג רשת" value={form.networkType} options={[{ v: 'M', l: 'נייד' }, { v: 'F', l: 'נייח' }]} onChange={v => setForm({ ...form, networkType: v, newDonor: '' })} />
                        <SelectField label="מפעיל ננטש *" value={form.newDonor} error={errors.newDonor} options={filteredOperators.map(o => ({ v: o.value, l: o.display }))} onChange={v => setForm({ ...form, newDonor: v })} />
                        <SelectField label="קוד הפעלה" value={form.activationType} options={[{ v: 'NEW', l: 'NEW' }, { v: 'NSC', l: 'NSC' }, { v: 'CCN', l: 'CCN' }]} onChange={v => setForm({ ...form, activationType: v })} />
                    </section>

                    {/* עמודה 2: זיהוי לקוח */}
                    <section className="space-y-4">
                        <h4 className="font-bold text-blue-700 border-b pb-2 flex items-center gap-2"><User size={16} /> זיהוי לקוח</h4>
                        <SelectField label="סוג מנוי" value={form.customerProfile} options={[{ v: 'I', l: 'לקוח מזוהה' }, { v: 'U', l: 'לקוח לא מזוהה' }]} onChange={v => setForm({ ...form, customerProfile: v })} />
                        <Field label={form.customerProfile === 'I' ? "מזהה לקוח 1 (ת\"ז) *" : "מזהה לקוח 1 *"} value={form.customerId1} error={errors.customerId1} onChange={v => setForm({ ...form, customerId1: v })} />
                        <Field label="מספר חוזה בילינג *" value={form.contractId} error={errors.contractId} onChange={v => setForm({ ...form, contractId: v })} />
                        <Field label="מס' הזמנת CRM *" value={form.crmOrderNum} error={errors.crmOrderNum} onChange={v => setForm({ ...form, crmOrderNum: v })} />
                    </section>

                    {/* עמודה 3: לוחות זמנים */}
                    <section className="space-y-4">
                        <h4 className="font-bold text-blue-700 border-b pb-2 flex items-center gap-2"><Calendar size={16} /> לוחות זמנים</h4>
                        <div className="bg-slate-50 p-3 rounded-lg space-y-3 border border-slate-100">
                            <DateTime label="תחילת ניוד מבוקש *" date={form.portedDate} time={form.portedTime} onDateChange={v => setForm({ ...form, portedDate: v })} onTimeChange={v => setForm({ ...form, portedTime: v })} />
                            <DateTime label="ביצוע ניוד מבוקש *" date={form.execDate} time={form.execTime} onDateChange={v => setForm({ ...form, execDate: v })} onTimeChange={v => setForm({ ...form, execTime: v })} />
                        </div>
                        <SelectField label="תשלום מראש *" value={form.prepaid} options={[{ v: 'N', l: 'N' }, { v: 'Y', l: 'Y' }]} onChange={v => setForm({ ...form, prepaid: v })} />
                        <Field label="מזהה לקוח CRM" value={form.crmCustomerId} onChange={v => setForm({ ...form, crmCustomerId: v })} />
                    </section>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 border-t flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-200 rounded-lg">ביטול</button>
                    <button onClick={validateAndSave} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-lg hover:bg-blue-700 flex items-center gap-2">
                        <Save size={16} /> הוסף תהליך
                    </button>
                </div>
            </div>
        </div>
    );
};

// רכיבי עזר
const Field = ({ label, value, onChange, error }: any) => (
    <div className="flex flex-col gap-1">
        <label className="text-[11px] font-bold text-slate-500 block px-1">{label}</label>
        <input type="text" className={`w-full p-2 border rounded-lg text-sm outline-none transition-all ${error ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-blue-400'}`} value={value} onChange={e => onChange(e.target.value)} />
        <div className="h-4 px-1">{error && <span className="text-[10px] text-red-600 font-bold">{error}</span>}</div>
    </div>
);

const SelectField = ({ label, value, options, onChange, error }: any) => (
    <div className="flex flex-col gap-1">
        <label className="text-[11px] font-bold text-slate-500 block px-1">{label}</label>
        <select className={`w-full p-2 border rounded-lg text-sm bg-white outline-none transition-all ${error ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-blue-400'}`} value={value} onChange={e => onChange(e.target.value)}>
            <option value="">- בחר -</option>
            {options.map((o: any) => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
        <div className="h-4 px-1">{error && <span className="text-[10px] text-red-600 font-bold">{error}</span>}</div>
    </div>
);

const DateTime = ({ label, date, time, onDateChange, onTimeChange }: any) => (
    <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-400 block px-1">{label}</label>
        <div className="flex gap-1">
            <input type="time" className="w-20 p-1 border border-slate-200 rounded text-xs outline-none" value={time} onChange={e => onTimeChange(e.target.value)} />
            <input type="date" className="flex-1 p-1 border border-slate-200 rounded text-xs outline-none" value={date} onChange={e => onDateChange(e.target.value)} />
        </div>
    </div>
);