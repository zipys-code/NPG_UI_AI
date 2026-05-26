import React, { useState } from 'react';
import { X, AlertTriangle, Calendar, Clock, MessageSquare, Power, AlertCircle } from 'lucide-react';

interface SystemStateModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentStatus: boolean; // true = up, false = down
    onConfirm: (data: any) => void;
    loading: boolean;
    serverError?: string | null;
}

export const SystemStateModal = ({ isOpen, onClose, currentStatus, onConfirm, loading, serverError }: SystemStateModalProps) => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [hour, setHour] = useState(new Date().getHours().toString().padStart(2, '0'));
    const [minute, setMinute] = useState(new Date().getMinutes().toString().padStart(2, '0'));
    const [description, setDescription] = useState('');
    const [descError, setDescError] = useState(false);

    if (!isOpen) return null;

    const isTurningOff = currentStatus; // אם עכשיו Up, הפעולה היא הורדה

    const handleAction = () => {
        if (!description.trim()) {
            setDescError(true); // צביעת המסגרת
            return;
        }

        const confirmMsg = isTurningOff
            ? "⚠️ אזהרה: פעולה זו תוריד את המערכת ותפסיק את כל הממשקים. להמשיך?"
            : "האם להעלות את המערכת?";

        if (window.confirm(confirmMsg)) {
            onConfirm({
                systemState: isTurningOff ? "0" : "1",
                dateFrom: date.split('-').reverse().join('/'), // DD/MM/YYYY
                timeFrom: `${hour}:${minute}`,
                description
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4" dir="rtl">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95">

                {/* Header - צבע משתנה לפי הפעולה */}
                <div className={`${isTurningOff ? 'bg-red-600' : 'bg-green-600'} px-6 py-4 flex justify-between items-center text-white`}>
                    <div className="flex items-center gap-2">
                        {isTurningOff ? <AlertTriangle size={20} /> : <Power size={20} />}
                        <h3 className="font-bold">{isTurningOff ? 'הורדת מערכת' : 'העלאת מערכת'}</h3>
                    </div>
                    <button onClick={onClose} className="text-white/80 hover:text-white"><X size={20} /></button>
                </div>
                {serverError && (
                    <div className="bg-red-50 border border-red-200 p-3 rounded-xl text-red-800 text-xs font-bold flex items-center gap-2 animate-in shake-in duration-300">
                        <AlertCircle size={16} className="shrink-0" />
                        {serverError}
                    </div>
                )}
                <div className="p-6 space-y-5">
                    {isTurningOff && (
                        <div className="bg-red-50 border border-red-100 p-3 rounded-lg text-red-700 text-xs font-bold flex items-start gap-2">
                            <AlertTriangle size={16} className="shrink-0" />
                            שים לב: הורדת המערכת תשפיע על כלל המפעילים והממשקים הפעילים.
                        </div>
                    )}

                    {/* בחירת זמן */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                                <Calendar size={12} /> תאריך:
                            </label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)}
                                className="w-full border rounded-lg p-2 text-sm outline-none focus:border-blue-500" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                                <Clock size={12} /> שעה:
                            </label>
                            <div className="flex items-center gap-1">
                                <select value={hour} onChange={e => setHour(e.target.value)} className="border rounded p-1.5 text-sm flex-1">
                                    {Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')).map(h => <option key={h} value={h}>{h}</option>)}
                                </select>
                                <span>:</span>
                                <select value={minute} onChange={e => setMinute(e.target.value)} className="border rounded p-1.5 text-sm flex-1">
                                    {Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0')).map(m => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* סיבת שינוי */}
                    <div className="space-y-1.5">
                        <label className={`text-[11px] font-bold flex items-center gap-1 ${descError ? 'text-red-500' : 'text-slate-500'}`}>
                            <MessageSquare size={12} /> סיבת שינוי (חובה):
                        </label>
                        <textarea
                            value={description}
                            onChange={e => {
                                setDescription(e.target.value);
                                if (e.target.value.trim()) setDescError(false); // ניקוי שגיאה בזמן הקלדה
                            }}
                            placeholder="הזן סיבה..."
                            className={`w-full border rounded-xl p-3 text-sm h-24 outline-none transition-all resize-none ${descError ? 'border-red-500 bg-red-50 focus:ring-red-100' : 'border-slate-200 focus:border-blue-500'
                                }`}
                        />
                        {descError && (
                            <p className="text-[10px] text-red-500 font-bold mt-1 mr-1">חובה להזין סיבה לביצוע הפעולה</p>
                        )}
                    </div>

                </div>

                <div className="p-4 bg-slate-50 border-t flex gap-3">
                    <button
                        onClick={handleAction}
                        disabled={loading}
                        className={`flex-1 py-2.5 rounded-xl text-white font-bold text-sm shadow-sm transition-all ${isTurningOff ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                            }`}
                    >
                        {loading ? 'מבצע...' : isTurningOff ? 'בצע הורדת מערכת' : 'בצע העלאת מערכת'}
                    </button>
                    <button onClick={onClose} className="px-6 py-2.5 text-slate-500 font-bold text-sm">ביטול</button>
                </div>
            </div>
        </div>
    );
};