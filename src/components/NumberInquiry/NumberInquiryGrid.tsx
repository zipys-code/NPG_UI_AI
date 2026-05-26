import React from 'react';
import { List, AlertCircle, Clock, CheckCircle2, XCircle } from 'lucide-react';

export const NumberInquiryGrid = ({ data, loading }) => {
    const getStatusInfo = (status) => {
        switch (status) {
            case "TERMINATED_SUCCESSFULLY": return { label: "הסתיים", color: "text-green-600 bg-green-50 border-green-200", icon: <CheckCircle2 size={14} /> };
            case "TERMINATED_ABNORMALLY": return { label: "נכשל", color: "text-red-600 bg-red-50 border-red-200", icon: <XCircle size={14} /> };
            case "IN_PROGRESS": return { label: "בריצה", color: "text-blue-600 bg-blue-50 border-blue-200", icon: <Clock size={14} /> };
            default: return { label: "מושהה", color: "text-slate-500 bg-slate-50 border-slate-200", icon: <AlertCircle size={14} /> };
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 bg-white rounded-xl border border-slate-200 shadow-sm animate-pulse">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <span className="text-slate-500 font-bold">מושך נתונים מהשרת...</span>
        </div>
    );

    return (
        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
            <div className="p-4 border-b bg-white flex items-center gap-2">
                <List size={18} className="text-blue-600" />
                <h3 className="text-lg font-bold text-slate-800">תוצאות שאילתת מספר ({data.length})</h3>
            </div>
            <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-right border-collapse">
                    <thead className="sticky top-0 bg-slate-50 z-10">
                        <tr className="text-slate-600 text-[12px] font-bold border-b border-slate-200">
                            <th className="p-3">תאריך הבקשה</th>
                            <th className="p-3">נשלח למפעיל</th>
                            <th className="p-3 text-center">מצב שאילתא</th>
                            <th className="p-3">מפעיל נוכחי</th>
                            <th className="p-3">מזהה בקשה</th>
                        </tr>
                    </thead>
                    <tbody className="text-[11px] divide-y divide-slate-100">
                        {data.length > 0 ? data.map((row, i) => {
                            const status = getStatusInfo(row.status);
                            return (
                                <tr key={i} className="hover:bg-blue-50/50 transition-colors">
                                    <td className="p-3 font-mono text-blue-700 whitespace-nowrap">{row.dateTime}</td>
                                    <td className="p-3 font-bold text-slate-800">{row.toOperator}</td>
                                    <td className="p-3">
                                        <div className={`flex items-center justify-center gap-1.5 px-2 py-1 rounded-full border text-[10px] font-bold ${status.color} mx-auto w-fit`}>
                                            {status.icon} {status.label}
                                        </div>
                                    </td>
                                    <td className="p-3">{row.currOperator || '---'}</td>
                                    <td className="p-3 font-medium text-slate-500">{row.requestID}</td>
                                </tr>
                            );
                        }) : (
                            <tr>
                                <td colSpan={5} className="p-20 text-center text-slate-400 italic">לא נמצאו רשומות לטווח התאריכים המבוקש</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};