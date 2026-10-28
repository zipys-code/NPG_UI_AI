import React, { useState, useMemo } from 'react';
import { FileDown, ArrowUpDown, ArrowUp, ArrowDown, ListTree } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from "@/context/AppContext";

interface EventViewerGridProps {
    data: any[];
    loading: boolean;
    appliedFilters: any;
}

export const EventViewerGrid: React.FC<EventViewerGridProps> = ({ data, loading, appliedFilters }) => {
    const { currentUser, lovs } = useApp();
    const [sortConfig, setSortConfig] = useState<any>({ key: 'txtEventId', direction: 'desc' });

    const parseDateValue = (dateStr: string) => {
        if (!dateStr) return 0;
        try {
            const [datePart, timePart] = dateStr.split(' ');
            const [d, m, y] = datePart.split('/');
            const [hh, mm] = timePart.split(':');
            return new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm)).getTime();
        } catch (e) {
            return 0;
        }
    };

    const handleSort = (key: string) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const sortedData = useMemo(() => {
        const items = [...data];
        if (sortConfig.direction) {
            items.sort((a, b) => {
                let aVal = a[sortConfig.key];
                let bVal = b[sortConfig.key];

                if (sortConfig.key === 'txtDateTime') {
                    aVal = parseDateValue(aVal);
                    bVal = parseDateValue(bVal);
                } else if (sortConfig.key === 'txtEventId') {
                    aVal = Number(aVal);
                    bVal = Number(bVal);
                } else {
                    aVal = (aVal || "").toString().toLowerCase();
                    bVal = (bVal || "").toString().toLowerCase();
                }

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return items;
    }, [data, sortConfig]);

    const getSortIcon = (key: string) => {
        if (sortConfig.key !== key) return <ArrowUpDown size={12} className="opacity-20" />;
        return sortConfig.direction === 'asc' ? <ArrowUp size={12} className="text-blue-600" /> : <ArrowDown size={12} className="text-blue-600" />;
    };

    // פונקציית עזר לתצוגת התאריך באקסל במקום ה-T שמפריד ביניהם כעת
    const formatDisplayDate = (isoString: string) => {
        if (!isoString) return '';
        return isoString.replace('T', ' שעה: ');
    };

    const exportToExcel = () => {
        const activeFiltersRows: string[][] = [];

        if (appliedFilters) {
            if (appliedFilters.eventId) activeFiltersRows.push([`מספר אירוע: ${appliedFilters.eventId}`]);
            if (appliedFilters.requestId) activeFiltersRows.push([`מזהה בקשה: ${appliedFilters.requestId}`]);

            if (appliedFilters.eventType) {
                const typeName = lovs?.['byEventTypes']?.item?.find((opt: any) => opt.value === appliedFilters.eventType)?.label || appliedFilters.eventType;
                activeFiltersRows.push([`סוג אירוע: ${typeName}`]);
            }

            if (appliedFilters.eventClass) activeFiltersRows.push([`סיווג אירוע: ${appliedFilters.eventClass}`]);

            // התיקון: שימוש במשתנים החדשים מהסטייט (fromDate ו-toDate)
            activeFiltersRows.push([`טווח תאריכים: ${formatDisplayDate(appliedFilters.fromDate)} עד ${formatDisplayDate(appliedFilters.toDate)}`]);
        }

        const headerInfo = [
            // התיקון: הורדנו את הלוכסן המיותר בשורות הבאות
            ["דו\"ח צפייה באירועים"],
            [`הופק ע"י: ${currentUser?.name || 'משתמש מערכת'}`],
            [`תאריך הפקה: ${new Date().toLocaleString('he-IL')}`],
            [""],
            ...(activeFiltersRows.length > 0 ? [["פילטרים שנבחרו:"], ...activeFiltersRows] : [["בוצע חיפוש ללא פילטרים"]]),
            [""],
        ];

        const tableData = sortedData.map(row => ({
            'מספר אירוע': row.txtEventId,
            'סוג אירוע': row.txtEventType,
            'זמן יצירה': row.txtDateTime,
            'מקור': row.txtEventSource,
            'תוכן האירוע': row.txtEventMsg,
            'סטטוס טיפול': row.txtTreatmentStatus
        }));

        const worksheet = XLSX.utils.aoa_to_sheet(headerInfo);
        const tableStartRow = headerInfo.length + 1;
        XLSX.utils.sheet_add_json(worksheet, tableData, { origin: `A${tableStartRow}`, skipHeader: false });

        // הגדרת כיוון RLT
        worksheet['!dir'] = "rtl";

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "אירועים");
        XLSX.writeFile(workbook, `Events_Report_${Date.now()}.xlsx`);
    };

    if (loading) return <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200 shadow-sm">טוען נתונים מהשרת...</div>;

    return (
        <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden" dir="rtl">
            <div className="p-4 flex justify-between items-center border-b border-slate-100 bg-white">
                <div className="flex items-center gap-2">
                    <ListTree size={18} className="text-slate-400" />
                    <h3 className="text-lg font-bold text-slate-800">רשימת אירועים ({data.length})</h3>
                </div>
                <button
                    onClick={exportToExcel}
                    disabled={data.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FileDown size={16} /> ייצוא לאקסל
                </button>
            </div>

            <div className="overflow-x-auto max-h-[600px]">
                <table className="w-full text-right border-separate border-spacing-0">
                    <thead className="sticky top-0 bg-[#f8fafc] z-10 shadow-sm">
                        <tr className="text-slate-600 text-[12px] font-bold">
                            <th className="p-3 border-l border-b border-slate-200 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('txtEventId')}>
                                <div className="flex items-center justify-between"><span>מספר אירוע</span>{getSortIcon('txtEventId')}</div>
                            </th>
                            <th className="p-3 border-l border-b border-slate-200 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('txtEventType')}>
                                <div className="flex items-center justify-between"><span>סוג אירוע</span>{getSortIcon('txtEventType')}</div>
                            </th>
                            <th className="p-3 border-l border-b border-slate-200 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('txtDateTime')}>
                                <div className="flex items-center justify-between"><span>זמן יצירה</span>{getSortIcon('txtDateTime')}</div>
                            </th>
                            <th className="p-3 border-l border-b border-slate-200 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('txtEventSource')}>
                                <div className="flex items-center justify-between"><span>מקור</span>{getSortIcon('txtEventSource')}</div>
                            </th>
                            <th className="p-3 border-b border-slate-200 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('txtEventMsg')}>
                                <div className="flex items-center justify-between"><span>תוכן האירוע</span>{getSortIcon('txtEventMsg')}</div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="text-[11px] text-slate-700">
                        {sortedData.length > 0 ? (
                            sortedData.map((row: any, idx) => (
                                <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-blue-50/30 transition-colors`}>
                                    <td className="p-3 border-l border-slate-100 font-bold text-slate-900">{row.txtEventId}</td>
                                    <td className="p-3 border-l border-slate-100">{row.txtEventType}</td>
                                    <td className="p-3 border-l border-slate-100 font-mono text-blue-700 whitespace-nowrap">{row.txtDateTime}</td>
                                    <td className="p-3 border-l border-slate-100">{row.txtEventSource}</td>
                                    <td className="p-3 border-slate-100 max-w-xs truncate" title={row.txtEventMsg}>{row.txtEventMsg}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={5} className="p-20 text-center text-slate-400 italic text-[13px]">
                                    לא נמצאו נתונים התואמים לחיפוש שלך
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};