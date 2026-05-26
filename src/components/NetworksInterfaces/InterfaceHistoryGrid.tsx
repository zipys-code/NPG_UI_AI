import React, { useMemo } from 'react';
import { Calendar, User, MessageSquare, Info } from 'lucide-react';

export const InterfaceHistoryGrid = ({ data = [] }: { data: any[] }) => {

    // פונקציית עזר להמרת תאריך טיבקו (DD/MM/YYYY HH:mm:ss) למספר לצורך מיון
    const parseTibcoDate = (dateStr: string) => {
        if (!dateStr || typeof dateStr !== 'string') return 0;
        try {
            const [datePart, timePart] = dateStr.split(' ');
            const [day, month, year] = datePart.split('/');
            const [hour, min, sec] = (timePart || "00:00:00").split(':');
            return new Date(
                parseInt(year),
                parseInt(month) - 1,
                parseInt(day),
                parseInt(hour),
                parseInt(min),
                parseInt(sec || "0")
            ).getTime();
        } catch (e) {
            return 0;
        }
    };

    // מיון הנתונים מהחדש ביותר לישן ביותר
    const sortedData = useMemo(() => {
        return [...data].sort((a, b) => {
            const timeA = parseTibcoDate(a.validFrom);
            const timeB = parseTibcoDate(b.validFrom);
            return timeB - timeA; // מהגדול (חדש) לקטן (ישן)
        });
    }, [data]);

    return (
        <div className="space-y-3">
            {/* כותרת עם מונה נתונים */}
            <div className="flex items-center justify-between bg-blue-50 px-4 py-2 rounded-lg border border-blue-100">
                <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
                    <Info size={16} />
                    <span>נמצאו {data.length} רשומות היסטוריה</span>
                </div>
                <div className="text-xs text-blue-600 font-medium">
                    * התצוגה ממוינת לפי זמן השינוי (מהחדש לישן)
                </div>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-right border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="p-3 text-xs font-bold text-slate-500">זמן שינוי</th>
                            <th className="p-3 text-xs font-bold text-slate-500">סוג ממשק</th>
                            <th className="p-3 text-xs font-bold text-slate-500 text-center">סטטוס חדש</th>
                            <th className="p-3 text-xs font-bold text-slate-500">סיבת שינוי</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                        {sortedData.length > 0 ? sortedData.map((item, idx) => (
                            <tr key={idx} className="hover:bg-blue-50/30 transition-colors">
                                <td className="p-3 text-sm text-slate-600 font-medium">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-slate-400" />
                                        {item.validFrom}
                                    </div>
                                </td>
                                <td className="p-3 text-sm text-slate-700 font-bold">
                                    {item.interfaceDirection === 'out' ? 'יוצא' :
                                        item.interfaceDirection === 'in' ? 'נכנס' : item.interfaceDirection}
                                </td>
                                <td className="p-3 text-center">
                                    <span className={`inline-flex px-2 py-1 rounded-md text-[10px] font-bold ${Number(item.availableFlag) === 1
                                            ? 'bg-green-100 text-green-700 border border-green-200'
                                            : 'bg-red-100 text-red-700 border border-red-200'
                                        }`}>
                                        {Number(item.availableFlag) === 1 ? 'ACTIVE' : 'DOWN'}
                                    </span>
                                </td>
                                <td className="p-3 text-sm text-slate-500 italic max-w-md" title={item.Description}>
                                    <div className="flex items-start gap-2">
                                        <MessageSquare size={14} className="mt-1 text-slate-300 shrink-0" />
                                        <span>{item.Description || 'ללא תיאור'}</span>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={4} className="p-10 text-center text-slate-400 italic">
                                    לא נמצאו נתונים להצגה
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};