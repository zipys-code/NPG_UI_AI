import React, { useState, useEffect } from 'react';
import { X, Download, Loader2, AlertCircle, List } from 'lucide-react';
import { useApp } from "@/context/AppContext";
import { apiRequest } from "@/services/api";

interface ProcessStatesModalProps {
    isOpen: boolean;
    onClose: () => void;
    processId: string;
}

// פונקציית עזר לסידור התאריך לפורמט המבוקש
const formatDateTime = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr; // למקרה שהפורמט לא מוכר

    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

export const ProcessStatesModal: React.FC<ProcessStatesModalProps> = ({ isOpen, onClose, processId }) => {
    // הוספתי פה שליפה של שם המשתמש מה-Context אם יש, אחרת נשתמש במשתנה הגלובלי או בברירת מחדל
    const { token, currentNetworkId, currentUser } = useApp() as any;
    const [statesData, setStatesData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        if (!isOpen || !processId) return;

        const fetchStates = async () => {
            setIsLoading(true);
            setErrorMsg(null);
            try {
                const res = await apiRequest('/GetProcessStates', {
                    getIn: {
                        processId: processId,
                        selfNetworkID: currentNetworkId,
                        token: token
                    }
                });

                const notification = res?.getOut?.notification?.msg;
                if (notification) {
                    const msgs = Array.isArray(notification) ? notification : [notification];
                    const errorMsgs = msgs.filter(m => m.severity !== 'SUCCESS' && m.severity !== 'INFO');

                    if (errorMsgs.length > 0) {
                        setErrorMsg(errorMsgs.map(m => m.msgBody || 'שגיאה מהשרת').join(' | '));
                        return;
                    }
                }

                const rawStates = res?.getOut?.ProcessStates;
                if (rawStates) {
                    const statesArray = Array.isArray(rawStates) ? rawStates : [rawStates];
                    statesArray.sort((a, b) => Number(b.process_state_num) - Number(a.process_state_num));
                    setStatesData(statesArray);
                } else {
                    setStatesData([]);
                }
            } catch (err) {
                console.error("Error fetching process states:", err);
                setErrorMsg("אירעה שגיאה בטעינת שלבי התהליך.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchStates();
    }, [isOpen, processId, currentNetworkId, token]);

    // ייצוא משודרג לאקסל (CSV)
    const exportToExcel = () => {
        if (!statesData.length) return;

        // שליפת הנתונים לדו"ח
        const reqId = statesData[0]?.request_id || '';
        const reportDate = formatDateTime(new Date().toISOString());

        // בניית כותרות הדו"ח הראשיות (כל שורה היא מערך של תאים)
        const topInfoRows = [
            ['"שלבי תהליך"'],
            ['"מספר תהליך:"', `"${processId}"`],
            ['"מזהה תהליך:"', `"${reqId}"`],
            ['"שם מפיק הדו""ח:"', `"${currentUser.name}"`], // פעמיים גרשיים כדי לברוח מגרשיים בתוך CSV
            ['"תאריך הפקת הדו""ח:"', `"${reportDate}"`],
            [] // שורת רווח לפני הטבלה עצמה
        ];

        const headers = ['מספר שלב', 'קוד שלב', 'שם שלב', 'קוד סיבה', 'תיאור סיבה', 'תאריך התחלה', 'תאריך סיום'];

        const dataRows = statesData.map(row => [
            row.process_state_num || '',
            row.state_type_id || '',
            `"${row.state_type_desc || ''}"`,
            row.state_reason_code || '',
            `"${row.state_reason_desc || ''}"`,
            `"${formatDateTime(row.state_date)}"`,
            `"${formatDateTime(row.state_end_date)}"`
        ]);

        // איחוד כל השורות למחרוזת אחת
        const csvContent = [
            ...topInfoRows.map(row => row.join(',')),
            headers.join(','),
            ...dataRows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `ProcessStates_${processId}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!isOpen) return null;

    return (
        // התיקון כאן: items-center עם p-4 מבטיח שתמיד יהיה שוליים מכל הכיוונים והמודל לא ייחתך
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/50 backdrop-blur-sm" dir="rtl">

            {/* הגבלת גובה ל-90% מהמסך (max-h-[90vh]) כדי שתמיד נראה את הקצוות */}
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 bg-[#2563eb] text-white rounded-t-xl shadow-sm shrink-0">
                    <div className="flex items-center gap-3">
                        <List size={22} />
                        <div className="flex flex-col gap-0.5">
                            <h3 className="font-bold text-lg leading-none">פירוט שלבי תהליך</h3>
                            <span className="text-[12.5px] font-medium text-blue-100 leading-none">תהליך מס': {processId}</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="hover:bg-white/20 p-1.5 rounded-full transition-colors focus:outline-none"
                        title="סגור"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Toolbar */}
                <div className="px-6 py-3 border-b border-slate-100 flex justify-end bg-white shrink-0">
                    <button
                        onClick={exportToExcel}
                        disabled={isLoading || statesData.length === 0}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed font-bold text-[12px] transition-colors shadow-sm"
                    >
                        <Download size={16} />
                        <span>ייצוא לאקסל</span>
                    </button>
                </div>

                {/* Content / Table */}
                <div className="flex-1 overflow-auto bg-slate-50/50 p-6">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center h-full text-blue-600">
                            <Loader2 size={32} className="animate-spin mb-4" />
                            <span className="text-sm font-bold">טוען נתונים...</span>
                        </div>
                    ) : errorMsg ? (
                        <div className="flex items-center gap-2 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
                            <AlertCircle size={20} />
                            <span className="text-sm font-bold">{errorMsg}</span>
                        </div>
                    ) : statesData.length === 0 ? (
                        <div className="text-center text-slate-500 mt-10">לא נמצאו שלבים לתהליך זה.</div>
                    ) : (
                        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
                            <table className="w-full text-right text-sm">
                                <thead className="bg-slate-100 text-slate-700 border-b border-slate-200 text-[13px] sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3 font-bold">מס'</th>
                                        <th className="px-4 py-3 font-bold">קוד שלב</th>
                                        <th className="px-4 py-3 font-bold">שם שלב</th>
                                        <th className="px-4 py-3 font-bold">קוד סיבה</th>
                                        <th className="px-4 py-3 font-bold w-[200px]">תיאור סיבה</th>
                                        <th className="px-4 py-3 font-bold">התחלה</th>
                                        <th className="px-4 py-3 font-bold">סיום</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-[12px]">
                                    {statesData.map((row, idx) => (
                                        <tr key={idx} className="hover:bg-blue-50/50 transition-colors">
                                            <td className="px-4 py-2.5 font-bold text-slate-700">{row.process_state_num}</td>
                                            <td className="px-4 py-2.5 text-slate-600">{row.state_type_id}</td>
                                            <td className="px-4 py-2.5 font-medium text-slate-800">{row.state_type_desc}</td>
                                            <td className="px-4 py-2.5 text-slate-600">{row.state_reason_code}</td>
                                            <td className="px-4 py-2.5 text-slate-600">{row.state_reason_desc}</td>
                                            <td className="px-4 py-2.5 text-slate-600" dir="ltr">{formatDateTime(row.state_date)}</td>
                                            <td className="px-4 py-2.5 text-slate-600" dir="ltr">{formatDateTime(row.state_end_date)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};