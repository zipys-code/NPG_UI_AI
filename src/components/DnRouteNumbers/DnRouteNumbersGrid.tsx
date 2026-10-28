import React, { useState, useMemo } from 'react';
import { FileDown, ArrowUpDown, ArrowUp, ArrowDown, Table } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useApp } from "@/context/AppContext";

interface DnRouteNumbersGridProps {
    data: any[];
    loading: boolean;
    showHistory: boolean;
    appliedFilters: any;
}

export const DnRouteNumbersGrid: React.FC<DnRouteNumbersGridProps> = ({ data, loading, showHistory, appliedFilters }) => {
    // מצב לניהול המיון
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
        key: 'ValidFromTS',
        direction: 'desc'
    });
    const { currentUser, lovs } = useApp();

    // פונקציה לביצוע המיון
    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // חישוב הנתונים הממוינים לפי ה-Timestamps
    const sortedData = useMemo(() => {
        const sortableItems = [...data];
        if (sortConfig.direction !== null) {
            sortableItems.sort((a, b) => {
                const aVal = a[sortConfig.key] ?? 0;
                const bVal = b[sortConfig.key] ?? 0;

                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [data, sortConfig]);

    // אייקון מיון
    const getSortIcon = (key: string) => {
        if (sortConfig.key !== key) return <ArrowUpDown size={12} className="opacity-20" />;
        return sortConfig.direction === 'asc' ?
            <ArrowUp size={12} className="text-blue-600" /> :
            <ArrowDown size={12} className="text-blue-600" />;
    };

    // ייצוא לאקסל
    // ייצוא לאקסל
    const exportToExcel = () => {
        // 1. יצירת רשימה דינמית של פילטרים שנבחרו בלבד
        const activeFiltersRows: string[][] = [];

        if (appliedFilters) {
            // -- מזהה בקשה --
            if (appliedFilters.requestId) activeFiltersRows.push([`מזהה בקשה: ${appliedFilters.requestId}`]);

            // -- מסנני מספר --
            if (appliedFilters.filterByNum === "SINGLE" && appliedFilters.mobileStart) {
                activeFiltersRows.push([`חיפוש מספר: ${appliedFilters.mobileStart}`]);
            } else if (appliedFilters.filterByNum === "RANGE" && appliedFilters.mobileStart && appliedFilters.mobileEnd) {
                activeFiltersRows.push([`חיפוש טווח: ${appliedFilters.mobileStart} עד ${appliedFilters.mobileEnd}`]);
            }

            // -- מפעילים --
            if (appliedFilters.operatorDonor) {
                const donorName = lovs?.['byBusiness']?.item?.find((opt: any) => opt.value === appliedFilters.operatorDonor)?.label || appliedFilters.operatorDonor;
                activeFiltersRows.push([`מפעיל ננטש: ${donorName}`]);
            }

            if (appliedFilters.operatorRecipient) {
                const recName = lovs?.['byBusiness']?.item?.find((opt: any) => opt.value === appliedFilters.operatorRecipient)?.label || appliedFilters.operatorRecipient;
                activeFiltersRows.push([`מפעיל קולט: ${recName}`]);
            }

            // -- רשת וסוג ניוד --
            if (appliedFilters.networkType) {
                const netName = lovs?.['byNetwork']?.item?.find((opt: any) => opt.value === appliedFilters.networkType)?.label || appliedFilters.networkType;
                activeFiltersRows.push([`רשת: ${netName}`]);
            }

            if (appliedFilters.portType) {
                const pType = appliedFilters.portType === "EXTERNAL" ? "חיצוני" : (appliedFilters.portType === "INTERNAL" ? "פנימי" : appliedFilters.portType);
                activeFiltersRows.push([`סוג ניוד: ${pType}`]);
            }

            // -- תאריכים והיסטוריה --
            if (appliedFilters.selectByDate === '1') {
                activeFiltersRows.push([`סינון תאריכים: מ- ${appliedFilters.fromDate.replace('T', ' ')} עד ${appliedFilters.toDate.replace('T', ' ')}`]);
                if (appliedFilters.includeHistory) {
                    activeFiltersRows.push([`היסטוריה: כלול`]);
                }
            }
        }

        // 2. בניית כותרת הדו"ח
        const headerInfo = [
            ['דו"ח נתוני ניוד'],
            [`הופק ע"י: ${currentUser?.name || 'משתמש מערכת'}`],
            [`תאריך הפקה: ${new Date().toLocaleString('he-IL')}`],
            [""],
            ...(activeFiltersRows.length > 0 ? [["פילטרים שנבחרו:"], ...activeFiltersRows] : [["בוצע חיפוש ללא פילטרים"]]),
            [""],
        ];

        // 3. הכנת נתוני הטבלה
        const tableData = sortedData.map(row => ({
            'מספר': row.DNfrom,
            'עד מספר': row.DNto,
            'תאריך ניוד': row.ValidFrom,
            ...(showHistory ? { 'עד תאריך': row.ValidTo } : {}),
            'ננטש': row.Pno,
            'קולט': row.Cno,
            'סוג רשת': row.NetworkType,
            'סוג מספר': row.RouteType,
            'LRN': row.LRN,
            'מזהה בקשה': row.RequestID
        }));

        // יצירת הגיליון
        const worksheet = XLSX.utils.aoa_to_sheet(headerInfo);
        const tableStartRow = headerInfo.length + 1;
        XLSX.utils.sheet_add_json(worksheet, tableData, { origin: `A${tableStartRow}`, skipHeader: false });

        // הגדרת כיוון RLT
        worksheet['!dir'] = "rtl";

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "תוצאות ניוד");
        XLSX.writeFile(workbook, `Dn_Route_Report_${new Date().getTime()}.xlsx`);
    };


    return (
        <div className="w-full bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden" dir="rtl">
            {/* Header הטבלה */}
            <div className="p-4 flex justify-between items-center border-b border-slate-100 bg-white">
                <div className="flex items-center gap-2">
                    <Table size={18} className="text-slate-400" />
                    <h3 className="text-lg font-bold text-slate-800">תוצאות ({data.length})</h3>
                </div>
                <button
                    onClick={exportToExcel}
                    // הכפתור יהיה חסום אם אין תוצאות או בזמן טעינה
                    disabled={data.length === 0 || loading}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FileDown size={16} />
                    ייצוא לאקסל
                </button>
            </div>

            {/* גוף הטבלה */}
            <div className="overflow-x-auto max-h-[600px]">
                <table className="w-full text-right border-separate border-spacing-0">
                    <thead className="sticky top-0 bg-[#f8fafc] z-10 shadow-sm">
                        <tr className="text-slate-600 text-[12px] font-bold">
                            <th className="p-3 border-l border-b border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => handleSort('DNfrom')}>
                                <div className="flex items-center justify-between gap-2"><span>מספר</span>{getSortIcon('DNfrom')}</div>
                            </th>
                            <th className="p-3 border-l border-b border-slate-200">עד מספר</th>
                            <th className="p-3 border-l border-b border-slate-200 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('ValidFromTS')}>
                                <div className="flex items-center justify-between gap-2"><span>תאריך ניוד</span>{getSortIcon('ValidFromTS')}</div>
                            </th>

                            {/* עמודת היסטוריה מותנית */}
                            {showHistory && (
                                <th className="p-3 border-l border-b border-slate-200 cursor-pointer text-blue-800 bg-blue-50/50 hover:bg-blue-100/50" onClick={() => handleSort('ValidToTS')}>
                                    <div className="flex items-center justify-between gap-2"><span>עד תאריך</span>{getSortIcon('ValidToTS')}</div>
                                </th>
                            )}

                            <th className="p-3 border-l border-b border-slate-200">ננטש</th>
                            <th className="p-3 border-l border-b border-slate-200 font-medium">קולט</th>
                            <th className="p-3 border-l border-b border-slate-200">סוג רשת</th>
                            <th className="p-3 border-l border-b border-slate-200">סוג מספר</th>
                            <th className="p-3 border-l border-b border-slate-200">LRN</th>
                            <th className="p-3 border-b border-slate-200">מזהה בקשה</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.length > 0 ? (
                            sortedData.map((row: any, idx) => (
                                <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'} hover:bg-blue-50/30 transition-colors text-[11px] text-slate-700`}>
                                    <td className="p-3 border-l border-slate-100 font-bold text-slate-900">{row.DNfrom}</td>
                                    <td className="p-3 border-l border-slate-100">{row.DNto}</td>
                                    <td className="p-3 border-l border-slate-100 whitespace-nowrap">{row.ValidFrom}</td>

                                    {showHistory && (
                                        <td className="p-3 border-l border-slate-100 font-semibold text-red-600 bg-red-50/10">
                                            {row.ValidTo || '---'}
                                        </td>
                                    )}

                                    <td className="p-3 border-l border-slate-100">{row.Pno}</td>
                                    <td className="p-3 border-l border-slate-100 font-medium text-blue-900">{row.Cno}</td>
                                    <td className="p-3 border-l border-slate-100 text-center">{row.NetworkType}</td>
                                    <td className="p-3 border-l border-slate-100 italic text-slate-500">{row.RouteType}</td>
                                    <td className="p-3 border-l border-slate-100 font-mono text-center">{row.LRN || '---'}</td>
                                    <td className="p-3 font-mono text-blue-600 font-medium tracking-tighter">{row.RequestID}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={showHistory ? 10 : 9} className="p-20 text-center text-slate-400 italic text-[13px]">
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