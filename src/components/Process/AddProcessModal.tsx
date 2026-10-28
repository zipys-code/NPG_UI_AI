import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, User, Calendar, Network, Plus, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { toast } from 'sonner';
import { NpgDatePicker } from '../Share/NpgDatePicker';

interface NetworkOption {
    value: string;
    display: string;
    networkType?: string;
}

const getInitialDateTime = (offsetMin: number) => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + offsetMin);
    return {
        date: d.toLocaleDateString('en-CA'),
        time: d.toTimeString().substring(0, 5)
    };
};

export const AddProcessModal = ({ isOpen, onClose, onSave }: {
    isOpen: boolean,
    onClose: () => void,
    onSave: (data: any) => Promise<any>
}) => {
    const { lovs, currentNetworkId, token } = useApp();
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [allMessages, setAllMessages] = useState<any[]>([]);
    const [requestId, setRequestId] = useState<string | null>(null);

    const initStart = getInitialDateTime(10);
    const initExec = getInitialDateTime(20);

    const [form, setForm] = useState({
        txtDnNum: '',
        slctProcessType: '', // <--- שינוי 1: דיפולט ריק
        slctDnNetworkType: 'M',
        customerProfile: 'I',
        slctDnType: 'NEW',
        slctDonorNetworkID: '',
        txtCrmOrderNum: '',
        txtBillContractID: '',
        txtBillCustomerID: '',
        txtCrmCustomerID: '',
        txtCustomerID1: '',
        txtCustomerID1Type: '9',
        txtCustomerID2: '',
        txtCustomerID3: '',
        txtRequestedPortDate: initStart.date,
        txtRequestedPortTime: initStart.time,
        txtRequestedExecDate: initExec.date,
        txtRequestedExecTime: initExec.time,
        txtTemporaryAttribute_rpar_: 'N'
    });

    useEffect(() => {
        if (isOpen) {
            setAllMessages([]);
            setRequestId(null);
            setIsSubmitting(false);
            setErrors({});

            const start = getInitialDateTime(10);
            const exec = getInitialDateTime(20);

            setForm({
                txtDnNum: '',
                slctProcessType: '', // <--- שינוי 2: איפוס למצב ריק
                slctDnNetworkType: 'M',
                customerProfile: 'I',
                slctDnType: 'NEW',
                slctDonorNetworkID: '',
                txtCrmOrderNum: '',
                txtBillContractID: '',
                txtBillCustomerID: '',
                txtCrmCustomerID: '',
                txtCustomerID1: '',
                txtCustomerID1Type: '9',
                txtCustomerID2: '',
                txtCustomerID3: '',
                txtRequestedPortDate: start.date,
                txtRequestedPortTime: start.time,
                txtRequestedExecDate: exec.date,
                txtRequestedExecTime: exec.time,
                txtTemporaryAttribute_rpar_: 'N'
            });
        }
    }, [isOpen]);

    const formatDateToDDMMYYYY = (dateStr: string) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    };

    const onlyNumbers = (val: string) => val.replace(/\D/g, '');

    const allNetworks = useMemo(() => {
        const getOptionsFromLOV = (categoryKey: string): NetworkOption[] => {
            const group = lovs?.[categoryKey];
            const items = group?.item || group;
            if (!items || !Array.isArray(items)) return [];
            return items.map(opt => ({
                value: String(opt.value || ''),
                display: String(opt.label || opt.display || opt.value || ''),
                networkType: opt.aditinalData1
            }));
        };

        return getOptionsFromLOV('byBusiness');
    }, [lovs]);

    const filteredOperators = useMemo(() =>
        allNetworks.filter((op: NetworkOption) =>
            !form.slctDnNetworkType || op.networkType === form.slctDnNetworkType
        )
        , [allNetworks, form.slctDnNetworkType]);

    useEffect(() => {
        if (isOpen && currentNetworkId && allNetworks.length > 0) {
            const currentOp = allNetworks.find(op => String(op.value) === String(currentNetworkId));
            if (currentOp && currentOp.networkType) {
                setForm(prev => ({
                    ...prev,
                    slctDnNetworkType: currentOp.networkType!,
                    slctDonorNetworkID: String(currentOp.value),
                }));
            }
        }
    }, [isOpen, currentNetworkId, allNetworks]);

    const validateAndSave = async () => {
        const newErrors: Record<string, string> = {};

        // הוולידציה פה למטה כבר תופסת את העובדה שהשדה ריק!
        if (!form.slctProcessType) newErrors.slctProcessType = "חובה לבחור סוג תהליך";
        if (!form.slctDonorNetworkID) newErrors.slctDonorNetworkID = "חובה";
        if (!form.txtDnNum) newErrors.txtDnNum = "חובה";
        if (form.customerProfile === 'I' && !form.txtCustomerID1) newErrors.txtCustomerID1 = "חובה";
        if (!form.txtBillContractID) newErrors.txtBillContractID = "חובה";
        if (!form.txtCrmOrderNum) newErrors.txtCrmOrderNum = "חובה";

        const now = new Date();
        const startDateTime = new Date(`${form.txtRequestedPortDate}T${form.txtRequestedPortTime}`);
        const execDateTime = new Date(`${form.txtRequestedExecDate}T${form.txtRequestedExecTime}`);

        if (startDateTime < now) {
            newErrors.txtRequestedPortDate = "זמן התחלה לא יכול להיות בעבר";
        }
        if (execDateTime <= startDateTime) {
            newErrors.txtRequestedExecDate = "זמן הביצוע חייב להיות אחרי זמן ההתחלה";
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length === 0) {
            setIsSubmitting(true);
            try {
                const dataToSave = {
                    ...form,
                    txtRequestedPortDate: formatDateToDDMMYYYY(form.txtRequestedPortDate),
                    txtRequestedExecDate: formatDateToDDMMYYYY(form.txtRequestedExecDate)
                };

                const response = await onSave(dataToSave);
                console.log("Response Received:", response);

                const finalData = response?.notification ? response : (response?.setOut || response?.root?.setOut);

                if (finalData?.notification) {
                    const rawMessages = finalData.notification.msg;
                    const msgArray = Array.isArray(rawMessages) ? rawMessages : (rawMessages ? [rawMessages] : []);

                    setAllMessages(msgArray);

                    const npgId = finalData.data?.npgRequestId;
                    if (npgId) {
                        setRequestId(npgId);
                    }

                    const isSuccess = msgArray.some(m =>
                        String(m.code) === "1000" ||
                        String(m.severity).toUpperCase() === 'SUCCESS'
                    );

                    if (isSuccess) {
                        toast.success("התהליך נוצר בהצלחה");
                    }
                } else {
                    toast.error("מבנה תשובה לא מזוהה מהשרת");
                }
            } catch (err) {
                console.error("Save error:", err);
                setAllMessages([{ severity: 'ERROR', msgBody: "שגיאת תקשורת מול השרת" }]);
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handleDateTimeChange = (val: string, dateField: string, timeField: string) => {
        if (!val) return;
        const [d, t] = val.split('T');
        setForm(prev => ({
            ...prev,
            [dateField]: d,
            [timeField]: t || '00:00'
        }));

        if (errors[dateField]) {
            setErrors(prev => {
                const newErr = { ...prev };
                delete newErr[dateField];
                return newErr;
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" dir="rtl">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl border border-slate-200 flex flex-col max-h-[90vh]">

                <div className="flex justify-between items-center px-6 py-3 bg-blue-600 text-white rounded-t-xl">
                    <div className="flex items-center gap-2">
                        <Plus size={20} />
                        <h3 className="font-bold text-lg">יצירת תהליך ניוד חדש</h3>
                    </div>
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full"><X size={20} /></button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {allMessages.length > 0 && (
                        <div className="mb-4 space-y-1">
                            {allMessages.map((msg, idx) => (
                                <div key={idx} className={`p-2 rounded flex flex-col gap-1 border text-sm ${(msg.severity?.$ || msg.severity) === 'ERROR' ? 'bg-red-50 border-red-100 text-red-800' : 'bg-green-50 border-green-100 text-green-800'}`}>
                                    <div className="flex items-center gap-2">
                                        <AlertCircle size={16} />
                                        <span className="font-bold">{msg.msgBody?.$ || msg.msgBody}</span>
                                    </div>
                                    {requestId && idx === 0 && (
                                        <div className="flex items-center gap-2 mr-6">
                                            <span className="font-bold text-sm">Request ID:</span>
                                            <span className="font-bold text-sm tracking-wider">{requestId}</span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-8">
                        <section className="space-y-3">
                            <h4 className="font-bold text-blue-700 border-b pb-1 flex items-center gap-2 text-sm">
                                <Network size={16} /> פרטי מנוי ורשת
                            </h4>
                            <SelectField
                                label="סוג תהליך *"
                                value={form.slctProcessType}
                                error={errors.slctProcessType}
                                defaultLabel="-ללא-" // <--- שינוי 3: מעבירים את המחרוזת המבוקשת
                                options={[
                                    { v: 'MNPP-1', l: 'MNPP-1' },
                                    { v: 'MNPP-1 PVC', l: 'MNPP-1 PVC' }
                                ]}
                                onChange={(v: string) => {
                                    setForm({ ...form, slctProcessType: v });
                                    setErrors(prev => ({ ...prev, slctProcessType: '' }));
                                }}
                            />
                            <Field label="מספר לניוד *" value={form.txtDnNum} error={errors.txtDnNum} onChange={(v: string) => {
                                setForm({ ...form, txtDnNum: onlyNumbers(v) });
                                setErrors(prev => ({ ...prev, txtDnNum: '' }));
                            }} />
                            <SelectField label="סוג רשת" value={form.slctDnNetworkType} options={[{ v: 'M', l: 'נייד' }, { v: 'F', l: 'נייח' }]} onChange={(v: string) => setForm({ ...form, slctDnNetworkType: v, slctDonorNetworkID: '' })} />
                            <SelectField label="מפעיל ננטש *" value={form.slctDonorNetworkID} error={errors.slctDonorNetworkID} options={filteredOperators.map(o => ({ v: o.value, l: o.display }))} onChange={(v: string) => {
                                setForm({ ...form, slctDonorNetworkID: v });
                                setErrors(prev => ({ ...prev, slctDonorNetworkID: '' }));
                            }} />
                            <SelectField label="קוד הפעלה" value={form.slctDnType} options={[{ v: 'NEW', l: 'NEW' }, { v: 'NSC', l: 'NSC' }]} onChange={(v: string) => setForm({ ...form, slctDnType: v })} />
                        </section>

                        <section className="space-y-3">
                            <h4 className="font-bold text-blue-700 border-b pb-1 flex items-center gap-2 text-sm">
                                <User size={16} /> זיהוי לקוח
                            </h4>
                            <SelectField label="סוג מנוי" value={form.customerProfile} options={[{ v: 'I', l: 'לקוח מזוהה' }, { v: 'U', l: 'לקוח לא מזוהה' }]} onChange={(v: string) => setForm({ ...form, customerProfile: v })} />
                            <Field label="מזהה לקוח 1 (תז) *" value={form.txtCustomerID1} error={errors.txtCustomerID1} onChange={(v: string) => {
                                setForm({ ...form, txtCustomerID1: onlyNumbers(v) });
                                setErrors(prev => ({ ...prev, txtCustomerID1: '' }));
                            }} />
                            <div className="grid grid-cols-2 gap-2">
                                <Field label="מזהה לקוח 2" value={form.txtCustomerID2} onChange={(v: string) => setForm({ ...form, txtCustomerID2: onlyNumbers(v) })} />
                                <Field label="מזהה לקוח 3" value={form.txtCustomerID3} onChange={(v: string) => setForm({ ...form, txtCustomerID3: onlyNumbers(v) })} />
                            </div>
                            <Field label="מזהה לקוח בילינג" value={form.txtBillCustomerID} onChange={(v: string) => setForm({ ...form, txtBillCustomerID: onlyNumbers(v) })} />
                            <Field label="מספר חוזה בילינג *" value={form.txtBillContractID} error={errors.txtBillContractID} onChange={(v: string) => {
                                setForm({ ...form, txtBillContractID: onlyNumbers(v) });
                                setErrors(prev => ({ ...prev, txtBillContractID: '' }));
                            }} />
                        </section>

                        <section className="space-y-3">
                            <h4 className="font-bold text-blue-700 border-b pb-1 flex items-center gap-2 text-sm">
                                <Calendar size={16} /> לוחות זמנים ו-CRM
                            </h4>
                            <div className="bg-slate-50 p-4 rounded-lg space-y-4 border border-slate-100">

                                <NpgDatePicker
                                    label="תחילת ניוד *"
                                    value={`${form.txtRequestedPortDate}T${form.txtRequestedPortTime}`}
                                    onChange={(val) => handleDateTimeChange(val, 'txtRequestedPortDate', 'txtRequestedPortTime')}
                                    showTime={true}
                                    error={errors.txtRequestedPortDate}
                                />

                                <NpgDatePicker
                                    label="ביצוע ניוד *"
                                    value={`${form.txtRequestedExecDate}T${form.txtRequestedExecTime}`}
                                    onChange={(val) => handleDateTimeChange(val, 'txtRequestedExecDate', 'txtRequestedExecTime')}
                                    showTime={true}
                                    error={errors.txtRequestedExecDate}
                                />

                            </div>
                            <SelectField label="תשלום מראש *" value={form.txtTemporaryAttribute_rpar_} options={[{ v: 'N', l: 'N' }, { v: 'Y', l: 'Y' }]} onChange={(v: string) => setForm({ ...form, txtTemporaryAttribute_rpar_: v })} />
                            <Field label="מס' הזמנת CRM *" value={form.txtCrmOrderNum} error={errors.txtCrmOrderNum} onChange={(v: string) => {
                                setForm({ ...form, txtCrmOrderNum: onlyNumbers(v) });
                                setErrors(prev => ({ ...prev, txtCrmOrderNum: '' }));
                            }} />
                            <Field label="מזהה לקוח CRM" value={form.txtCrmCustomerID} onChange={(v: string) => setForm({ ...form, txtCrmCustomerID: onlyNumbers(v) })} />
                        </section>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 border-t flex justify-start gap-3 rounded-b-xl">
                    {allMessages.some(m => String(m.code || m.code?.$) === '1000') ? (
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-lg hover:bg-blue-700 transition-all flex items-center gap-2"
                        >
                            <CheckCircle2 size={18} />
                            <span>סגור</span>
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={validateAndSave}
                                disabled={isSubmitting}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-lg hover:bg-blue-700 flex items-center gap-2 disabled:bg-slate-400"
                            >
                                {isSubmitting ? (
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : <Save size={18} />}
                                {isSubmitting ? 'שולח...' : 'הוסף תהליך'}
                            </button>
                            <button
                                onClick={onClose}
                                disabled={isSubmitting}
                                className="px-4 py-2 font-bold text-slate-500 hover:bg-slate-200 rounded-lg transition-all"
                            >
                                ביטול
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const Field = ({ label, value, onChange, error, disabled }: any) => (
    <div className="flex flex-col gap-1 mb-1">
        <label className="text-[11px] font-semibold text-slate-500 pr-1">{label}</label>
        <input
            type="text"
            disabled={disabled}
            className={`w-full px-2 py-1.5 h-7 border rounded text-[11px] outline-none transition-all ${disabled ? 'bg-slate-50 opacity-70' : 'bg-white'} ${error ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-blue-500 shadow-sm'}`}
            value={value}
            onChange={e => onChange(e.target.value)}
        />
        {error && <span className="text-[10px] text-red-600 font-semibold pr-1 mt-[-2px]">{error}</span>}
    </div>
);

// הוספנו את defaultLabel בתור Prop כדי שנוכל לשלוט על מה כתוב בשורה הריקה
const SelectField = ({ label, value, options, onChange, error, disabled, defaultLabel = "- בחר -" }: any) => (
    <div className="flex flex-col gap-1 mb-1">
        <label className="text-[11px] font-semibold text-slate-500 pr-1">{label}</label>
        <select
            disabled={disabled}
            className={`w-full px-2 py-1 h-7 border rounded text-[11px] bg-white outline-none transition-all ${disabled ? 'bg-slate-100 cursor-not-allowed opacity-70' : ''} ${error ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-blue-500 shadow-sm'}`}
            value={value}
            onChange={e => onChange(e.target.value)}
        >
            <option value="">{defaultLabel}</option>
            {options.map((o: any) => <option key={o.v} value={o.v}>{o.l}</option>)}
        </select>
        {error && <span className="text-[10px] text-red-600 font-semibold pr-1 mt-[-2px]">{error}</span>}
    </div>
);