import React, { useState, useMemo } from 'react';
import { FileDown, FileJson, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from "@/context/AppContext";

export const GetMessagesGrid = ({ data, loading, appliedFilters }: any) => {
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
        key: 'DateTime',
        direction: 'desc'
    });
    const { currentUser, lovs } = useApp();

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const sortedData = useMemo(() => {
        if (!sortConfig.key || !sortConfig.direction) return data;
        return [...data].sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
            if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        });
    }, [data, sortConfig]);

    // בתוך GetMessagesGrid.tsx
    const exportToExcel = () => {
        // הוספת פילטרים שנבחרו לכותרת האקסל
        const activeFilters = [
            ["דו\"ח צפייה במסרים"],
            [`הופק ע\"י: ${currentUser?.name || 'מערכת'}`],
            [`תאריך הפקה: ${new Date().toLocaleString('he-IL')}`],
            [""],
            ["פילטרים:"],
            // שימוש ב-"" כברירת מחדל כדי למנוע הדפסת "undefined" באקסל
            [appliedFilters?.requestId ? `מזהה בקשה: ${appliedFilters.requestId}` : ""],
            [appliedFilters?.msgType && appliedFilters.msgType !== 'None' ? `סוג מסר: ${appliedFilters.msgType}` : ""],
            [`טווח תאריכים: ${appliedFilters?.dateFrom || ''} עד ${appliedFilters?.dateTo || ''}`],
            [""]
        ];

        const tableData = sortedData.map(row => ({
            'סוג הודעה': row.messagetype,
            'שולח': row.from,
            'מקבל': row.to,
            'מספר הודעה': row.messageId,
            'סטטוס': row.status,
            'תאריך': row.DateTime,
            'קוד שגיאה': row.errorCode,
            'תיאור': row.errorDesc
        }));

        const worksheet = XLSX.utils.aoa_to_sheet(activeFilters);
        XLSX.utils.sheet_add_json(worksheet, tableData, { origin: `A${activeFilters.length + 1}`, skipHeader: false });

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Messages");
        XLSX.writeFile(workbook, `Messages_Report_${new Date().getTime()}.xlsx`);
    };

    const showXML = (xml: string) => {
        const win = window.open('', '_blank', 'width=800,height=600');
        if (win) {
            win.document.write(`<pre style="direction: ltr; text-align: left; padding: 20px; font-family: monospace;">${xml.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`);
            win.document.title = "Message Body";
        }
    };

    const SortIcon = ({ column }: { column: string }) => {
        if (sortConfig.key !== column) return <ArrowUpDown size={12} className="text-slate-300" />;
        return sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-blue-600" /> : <ArrowDown size={12} className="text-blue-600" />;
    };

    const thClass = "p-3 border-l border-slate-100 text-slate-500 font-bold cursor-pointer hover:bg-slate-100 transition-colors";

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                <span className="text-xs font-bold text-slate-600">תוצאות חיפוש ({data.length})</span>

                {/* כפתור מעודכן לאחידות עם צפייה באירועים */}
                <button
                    onClick={exportToExcel}
                    disabled={data.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FileDown size={16} />
                    <span>ייצוא לאקסל</span>
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-right text-[11px] border-collapse">
                    <thead>
                        <tr className="bg-slate-50/50">
                            <th className="p-3 border-l border-slate-100 w-10 text-center">XML</th>
                            <th className={thClass} onClick={() => handleSort('messagetype')}>סוג מסר <SortIcon column="messagetype" /></th>
                            <th className={thClass} onClick={() => handleSort('from')}>שולח <SortIcon column="from" /></th>
                            <th className={thClass} onClick={() => handleSort('to')}>מקבל <SortIcon column="to" /></th>
                            <th className={thClass} onClick={() => handleSort('messageId')}>מספר הודעה <SortIcon column="messageId" /></th>
                            <th className={thClass} onClick={() => handleSort('status')}>סטטוס <SortIcon column="status" /></th>
                            <th className={thClass} onClick={() => handleSort('DateTime')}>תאריך <SortIcon column="DateTime" /></th>
                            <th className={thClass} onClick={() => handleSort('errorCode')}>קוד שגיאה <SortIcon column="errorCode" /></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={8} className="p-20 text-center"><div className="animate-spin h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" /></td></tr>
                        ) : sortedData.length > 0 ? (
                            sortedData.map((row: any, i: number) => (
                                <tr key={i} className="border-b border-slate-100 hover:bg-blue-50/30 transition-colors">
                                    <td className="p-2 border-l border-slate-100 text-center">
                                        <button onClick={() => showXML(row.messageBody)} className="text-slate-400 hover:text-blue-600 p-1"><FileJson size={16} /></button>
                                    </td>
                                    <td className="p-3 border-l border-slate-100 font-bold text-slate-700">{row.messagetype}</td>
                                    <td className="p-3 border-l border-slate-100">{row.from}</td>
                                    <td className="p-3 border-l border-slate-100">{row.to}</td>
                                    <td className="p-3 border-l border-slate-100 font-mono text-blue-600">{row.messageId}</td>
                                    <td className="p-3 border-l border-slate-100">
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${row.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="p-3 border-l border-slate-100 text-slate-500">{row.DateTime}</td>
                                    <td className="p-3 border-l border-slate-100 font-bold text-red-500">{row.errorCode}</td>
                                </tr>
                            ))
                        ) : (
                            <tr><td colSpan={8} className="p-20 text-center text-slate-400 italic">אין נתונים להצגה</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};