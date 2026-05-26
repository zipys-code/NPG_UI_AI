import React, { useState, useEffect } from 'react';
import { X, Globe, Save, AlertCircle, Link, FileText } from 'lucide-react';

interface NetworkEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (data: any) => void;
    operator: any;
    network?: any;
    loading: boolean;
    serverError?: string | null;
}

export const NetworkEditModal = ({
    isOpen, onClose, onConfirm, operator, network, loading, serverError
}: NetworkEditModalProps) => {

    const [formData, setFormData] = useState({
        NetworkIdentifier: '',
        NetworkName: '',
        NetworkType: 'M',
        NetworkSelfIdentity: 'false',
        RangeUnit: '',
        KosherFlag: 'false',
        AliasNetworkLRN: '',
        AliasNetworkId: '',
        NetworkEnabled: 'false', // שינוי ל-false כברירת מחדל ביצירה
        SystemOutgoingURL: '',
        SystemDesc: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        if (isOpen) {
            if (network) {
                setFormData({
                    NetworkIdentifier: network.NetworkIdentifier || '',
                    NetworkName: network.NetworkName || '',
                    NetworkType: network.NetworkType === 'נייד' ? 'M' : (network.NetworkType === 'נייח' ? 'F' : (network.NetworkType || 'M')),
                    NetworkSelfIdentity: String(network.NetworkSelfIdentity || 'false'),
                    RangeUnit: network.RangeUnit || '',
                    KosherFlag: String(network.KosherFlag || 'false'),
                    AliasNetworkLRN: network.AliasNetworkLRN || '',
                    AliasNetworkId: network.AliasNetworkId || '',
                    NetworkEnabled: String(network.Enabled || 'true'),
                    SystemOutgoingURL: network.OutgoingURL || '',
                    SystemDesc: network.SystemDesc || ''
                });
            } else {
                setFormData({
                    NetworkIdentifier: '', NetworkName: '', NetworkType: 'M',
                    NetworkSelfIdentity: 'false', RangeUnit: '', KosherFlag: 'false',
                    AliasNetworkLRN: '', AliasNetworkId: '',
                    NetworkEnabled: 'false', // וידוא שבחדש זה תמיד false
                    SystemOutgoingURL: '', SystemDesc: ''
                });
            }
            setErrors({});
        }
    }, [isOpen, network]);

    if (!isOpen) return null;

    const isEdit = !!network;

    const validate = () => {
        const newErrors: Record<string, string> = {};
        const requiredFields = ['NetworkIdentifier', 'NetworkName', 'RangeUnit', 'SystemOutgoingURL'];
        requiredFields.forEach(field => {
            if (!formData[field as keyof typeof formData]?.trim()) newErrors[field] = "שדה חובה";
        });
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        onConfirm({
            ...formData,
            NetworkId: isEdit ? network.NetworkId : "-1",
            NetworkBusinessId: operator?.BusinessId,
            mode: isEdit ? "Modify" : "Add"
        });
    };

    // שיפור ה-input: פחות גובה (py-1.5) ויותר רווח פנימי
    const inputClass = (fieldName: string) => `
        w-full border rounded-lg py-1.5 px-3 text-[11px] outline-none transition-all
        ${errors[fieldName] ? 'border-red-500 bg-red-50' : 'border-slate-200 focus:border-blue-500'}
        ${isEdit && fieldName === 'NetworkIdentifier' ? 'bg-slate-50 cursor-not-allowed text-slate-400' : 'bg-white'}
    `;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[110] p-2 md:p-4" dir="rtl">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200 overflow-hidden">

                {/* Header - תיקון: גובה מינימלי ומניעת חיתוך */}
                <div className="bg-blue-600 px-5 py-3 flex justify-between items-center text-white shrink-0">
                    <div className="flex items-center gap-2 overflow-hidden flex-nowrap">
                        <Globe size={16} className="shrink-0" />
                        <h3 className="font-bold text-sm truncate whitespace-nowrap">
                            {isEdit ? `עריכת רשת: ${network.NetworkName}` : `הוספת רשת: ${operator?.BusinessName}`}
                        </h3>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white transition-colors p-1">
                        <X size={20} />
                    </button>
                </div>

                {/* תוכן המודול - צמצום ריווחים (p-5 במקום p-8) */}
                <div className="p-5 space-y-3 overflow-y-auto custom-scrollbar flex-1">
                    {serverError && (
                        <div className="bg-red-50 border border-red-200 p-2 rounded-lg text-red-800 text-[10px] font-bold flex items-center gap-2">
                            <AlertCircle size={14} /> {serverError}
                        </div>
                    )}

                    {/* גריד שדות - gap מצומצם */}
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 mr-1">מזהה רשת *</label>
                            <input disabled={isEdit} className={inputClass('NetworkIdentifier')} value={formData.NetworkIdentifier} onChange={e => setFormData({ ...formData, NetworkIdentifier: e.target.value })} />
                            {errors.NetworkIdentifier && <p className="text-[9px] text-red-500 font-bold">{errors.NetworkIdentifier}</p>}
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 mr-1">שם רשת *</label>
                            <input className={inputClass('NetworkName')} value={formData.NetworkName} onChange={e => setFormData({ ...formData, NetworkName: e.target.value })} />
                            {errors.NetworkName && <p className="text-[9px] text-red-500 font-bold">{errors.NetworkName}</p>}
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 mr-1">סוג רשת *</label>
                            <select className={inputClass('NetworkType')} value={formData.NetworkType} onChange={e => setFormData({ ...formData, NetworkType: e.target.value })}>
                                <option value="M">נייד</option>
                                <option value="F">נייח</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 mr-1">יחידת טווח *</label>
                            <input className={inputClass('RangeUnit')} value={formData.RangeUnit} onChange={e => setFormData({ ...formData, RangeUnit: e.target.value })} />
                            {errors.RangeUnit && <p className="text-[9px] text-red-500 font-bold">{errors.RangeUnit}</p>}
                        </div>
                    </div>

                    {/* אזור המתגים - עיצוב דחוס */}
                    <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-sm">
                        <BooleanSwitch label="זיהוי עצמי" value={formData.NetworkSelfIdentity} onChange={val => setFormData({ ...formData, NetworkSelfIdentity: val })} />
                        <BooleanSwitch label="תומך כשר" value={formData.KosherFlag} onChange={val => setFormData({ ...formData, KosherFlag: val })} />
                        <BooleanSwitch label="רשת פעילה" value={formData.NetworkEnabled} onChange={val => setFormData({ ...formData, NetworkEnabled: val })} />
                    </div>

                    <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 mr-1">LRN פנימי</label>
                            <input className={inputClass('AliasNetworkLRN')} value={formData.AliasNetworkLRN} onChange={e => setFormData({ ...formData, AliasNetworkLRN: e.target.value })} />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 mr-1">מזהה רשת פנימית</label>
                            <input className={inputClass('AliasNetworkId')} value={formData.AliasNetworkId} onChange={e => setFormData({ ...formData, AliasNetworkId: e.target.value })} />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 mr-1">
                            <Link size={12} className="text-blue-500" /> כתובת ממשק יוצא (URL) *
                        </label>
                        <input dir="ltr" className={inputClass('SystemOutgoingURL')} value={formData.SystemOutgoingURL} onChange={e => setFormData({ ...formData, SystemOutgoingURL: e.target.value })} />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 mr-1">
                            <FileText size={12} className="text-slate-400" /> תיאור הממשק
                        </label>
                        {/* הקטנת גובה התיאור ל-h-12 למניעת גלילה */}
                        <textarea className={`${inputClass('SystemDesc')} h-12 resize-none`} value={formData.SystemDesc} onChange={e => setFormData({ ...formData, SystemDesc: e.target.value })} />
                    </div>
                </div>

                {/* Footer - תיקון: יישור לימין וגובה מצומצם */}
                <div className="px-6 py-3 bg-slate-50 border-t flex justify-start gap-3 shrink-0">
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="px-6 py-1.5 bg-blue-600 text-white rounded-lg font-bold text-xs shadow-md flex items-center gap-2 hover:bg-blue-700 transition-all active:scale-95"
                    >
                        {loading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={14} />}
                        {isEdit ? 'עדכן רשת' : 'הוסף רשת'}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-1.5 text-slate-500 font-bold text-xs hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        ביטול
                    </button>
                </div>
            </div>
        </div>
    );
};

const BooleanSwitch = ({ label, value, onChange }: any) => (
    <div className="flex flex-col gap-2">
        <label className="text-[10px] font-bold text-slate-500 text-center">{label}</label>
        <div className="flex bg-white rounded-lg p-0.5 border border-slate-200 shadow-sm">
            <button
                onClick={() => onChange('true')}
                className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all ${value === 'true' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}
            >
                כן
            </button>
            <button
                onClick={() => onChange('false')}
                className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all ${value === 'false' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:bg-slate-50'}`}
            >
                לא
            </button>
        </div>
    </div>
);