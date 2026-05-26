import React, { useState, useMemo } from 'react';
import { Search, CheckCircle2, XCircle, FileDown, ArrowUpDown, ArrowUp, ArrowDown, Edit } from 'lucide-react';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

interface NumberingPlanGridProps {
    data: any[];
    loading: boolean;
    filters: any;
    userName: string;
    onEdit: (row: any) => void;
}

export const NumberingPlanGrid: React.FC<NumberingPlanGridProps> = ({ data, loading, filters, userName, onEdit }) => {
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
        key: 'txtValidFrom',
        direction: 'desc'
    });

    const toTimestamp = (dateStr: string) => {
        if (!dateStr || dateStr === '---' || typeof dateStr !== 'string') return 0;
        const parts = dateStr.trim().split(' ')[0].split('/');
        if (parts.length !== 3) return 0;
        const [d, m, y] = parts;
        return new Date(+y, +m - 1, +d).getTime();
    };

    const sortedData = useMemo(() => {
        if (!data || !Array.isArray(data)) return [];
        const sortableItems = [...data];
        if (sortConfig.direction !== null) {
            sortableItems.sort((a, b) => {
                let aVal = a[sortConfig.key] ?? '';
                let bVal = b[sortConfig.key] ?? '';
                if (sortConfig.key === 'txtValidFrom' || sortConfig.key === 'txtValidTo') {
                    aVal = toTimestamp(String(aVal));
                    bVal = toTimestamp(String(bVal));
                }
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [data, sortConfig]);

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
        setSortConfig({ key, direction });
    };

    const isTrue = (val: any) => String(val).toLowerCase().trim() === 'true';

    const exportToExcel = () => {
        try {
            const now = format(new Date(), 'dd/MM/yyyy HH:mm');

            // 1. יצירת רשימה דינמית של פילטרים שנבחרו בלבד
            const activeFiltersRows: string[][] = [];

            if (filters) {
                // -- סינון לפי תוקף ותאריכים --
                const validityText = filters.validity === 'Active' ? 'ערכים פעילים בלבד' : 'כל הרשומות (היסטוריה)';
                activeFiltersRows.push([`סינון לפי תוקף: ${validityText}`]);

                if (filters.validity === 'History') {
                    activeFiltersRows.push([`מתאריך: ${format(new Date(filters.dateFrom), 'dd/MM/yyyy')} עד תאריך: ${format(new Date(filters.dateTo), 'dd/MM/yyyy')}`]);
                }

                // -- סינון לפי מפעיל --
                if (filters.operator) {
                    activeFiltersRows.push([`מפעיל: ${filters.operator}`]); // אם יש לך גישה ל-lovs תוכלי להמיר לשם מלא, כרגע נציג את הקוד
                }

                // -- סוג קו (חינם/בתשלום) --
                if (filters.tollFree !== '0') {
                    const tollFreeText = filters.tollFree === 'true' ? 'שיחות חינם' : 'שיחות בתשלום';
                    activeFiltersRows.push([`סוג קו: ${tollFreeText}`]);
                }

                // -- מסנני מספר (בודד / טווח) --
                if (filters.numberFilterType === 'Single' && filters.dnNumber) {
                    activeFiltersRows.push([`חיפוש לפי מספר: ${filters.dnNumber}`]);
                } else if (filters.numberFilterType === 'Range' && filters.fromNumber && filters.toNumber) {
                    activeFiltersRows.push([`חיפוש לפי טווח: ${filters.fromNumber} עד ${filters.toNumber}`]);
                }

                // -- סינון לפי רשת --
                if (filters.network) {
                    activeFiltersRows.push([`רשת: ${filters.network}`]);
                }

                // -- מספר כשר --
                if (filters.kosherFilter !== '0') {
                    const kosherText = filters.kosherFilter === 'true' ? 'כשר' : 'לא כשר';
                    activeFiltersRows.push([`מספר כשר: ${kosherText}`]);
                }
            }

            // 2. הכנת נתוני הטבלה
            const tableRows = sortedData.map(row => [
                row.txtDNfrom, row.txtDNto, row.txtNetworkType, row.txtRH,
                row.txtKosherFlag === "true" ? "כן" : "לא",
                row.txtTollFreeFlag === "true" ? "כן" : "לא",
                row.txtValidFrom, row.txtValidTo
            ]);

            // 3. בניית המעטפת (Header) של הדו"ח
            const headerInfo = [
                ["תוכנית מספור ארצית"],
                [`הופק ע"י: ${userName}`],
                [`תאריך הפקה: ${now}`],
                [""],
                ...(activeFiltersRows.length > 0 ? [["פילטרים שהוחלו:"], ...activeFiltersRows] : [["בוצע חיפוש ללא פילטרים"]]),
                [""],
                ["תחילת טווח", "סוף טווח", "רשת", "מפעיל", "כשר", "חינם", "תקף מ-", "תקף עד"]
            ];

            // 4. יצירת הגיליון והוספת הנתונים
            const worksheet = XLSX.utils.aoa_to_sheet(headerInfo);
            const tableStartRow = headerInfo.length; // השורה שאחרי כותרות העמודות
            XLSX.utils.sheet_add_aoa(worksheet, tableRows, { origin: `A${tableStartRow + 1}` });

            // הגדרת כיוון RLT
            worksheet['!dir'] = "rtl";

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
            XLSX.writeFile(workbook, `NumberingPlan_${format(new Date(), 'yyyyMMdd')}.xlsx`);
        } catch (err) { console.error(err); }
    };

    // חלוקת אחוזים שמסתכמת ל-100% (פחות או יותר)
    const columns = [
        { key: 'edit', label: 'ערוך', width: '5%', align: 'center' },
        { key: 'txtDNfrom', label: 'תחילת טווח', width: '12%' },
        { key: 'txtDNto', label: 'סוף טווח', width: '12%' },
        { key: 'txtNetworkType', label: 'רשת', width: '10%' },
        { key: 'txtRH', label: 'מפעיל', width: '25%' },
        { key: 'txtKosherFlag', label: 'כשר', width: '7%', align: 'center' },
        { key: 'txtTollFreeFlag', label: 'חינם', width: '7%', align: 'center' },
        { key: 'txtValidFrom', label: 'תקף מ-', width: '11%' },
        { key: 'txtValidTo', label: 'תקף עד', width: '11%' },
    ];

    return (
        <div className="bg-white border border-slate-200 rounded shadow-sm overflow-hidden mt-4 w-full">
            <div className="bg-slate-50 p-2.5 border-b border-slate-200 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">תוצאות ({data.length})</h3>
                <button
                    onClick={(e) => { e.preventDefault(); exportToExcel(); }}
                    disabled={data.length === 0 || loading}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <FileDown size={16} />
                    ייצוא לאקסל
                </button>
            </div>

            <div className="overflow-x-auto max-h-[650px]">
                <table className="w-full border-collapse table-fixed">
                    <thead className="sticky top-0 z-20 bg-slate-50 shadow-sm">
                        <tr className="border-b-2 border-[#4B9CD3]">
                            {columns.map(col => (
                                <th
                                    key={col.key}
                                    style={{ width: col.width }}
                                    className={`p-3 border-l border-slate-200 text-[11px] font-bold text-slate-700 ${col.align === 'center' ? 'text-center' : 'text-right'} ${col.key !== 'edit' ? 'cursor-pointer hover:bg-slate-100' : ''}`}
                                    onClick={() => col.key !== 'edit' && handleSort(col.key)}
                                >
                                    <div className={`flex items-center gap-1 ${col.align === 'center' ? 'justify-center' : 'justify-between'}`}>
                                        <span>{col.label}</span>
                                        {col.key !== 'edit' && <ArrowUpDown size={10} className="opacity-30" />}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {sortedData.map((row, idx) => (
                            <tr key={idx} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/20'} hover:bg-blue-50/50 transition-colors h-10`}>
                                {/* עמודת עריכה */}
                                <td className="p-1 border-l border-slate-100 text-center">
                                    <button
                                        onClick={() => onEdit(row)}
                                        className="text-blue-600 hover:bg-blue-100 p-1.5 rounded-full transition-all"
                                        title="ערוך רשומה"
                                    >
                                        <Edit size={14} /> {/* החלפנו את Search ב-Edit */}
                                    </button>
                                </td>

                                {/* שאר עמודות הנתונים - ממופות לפי המפתחות מה-JSON */}
                                <td className="p-3 border-l border-slate-200 text-[13px] font-mono text-slate-700 truncate">{row.txtDNfrom}</td>
                                <td className="p-3 border-l border-slate-200 text-[13px] font-mono text-slate-700 truncate">{row.txtDNto}</td>
                                <td className="p-3 border-l border-slate-200 text-[11px] font-bold text-slate-500 truncate">{row.txtNetworkType}</td>
                                <td className="p-3 border-l border-slate-200 text-[12px] font-bold text-blue-900 truncate">{row.txtRH}</td>

                                {/* עמודת כשרות */}
                                <td className="p-3 border-l border-slate-200 text-center">
                                    {isTrue(row.txtKosherFlag) ?
                                        <CheckCircle2 size={18} className="text-emerald-500 inline" /> :
                                        <XCircle size={18} className="text-red-400 opacity-80 inline" />
                                    }
                                </td>

                                {/* עמודת שיחות חינם */}
                                <td className="p-3 border-l border-slate-200 text-center">
                                    {isTrue(row.txtTollFreeFlag) ?
                                        <CheckCircle2 size={18} className="text-emerald-500 inline" /> :
                                        <XCircle size={18} className="text-red-400 opacity-80 inline" />
                                    }
                                </td>

                                <td className="p-3 border-l border-slate-200 text-[11px] text-slate-600 truncate">{row.txtValidFrom}</td>
                                <td className="p-3 border-l border-slate-200 text-[11px] text-slate-400 font-medium truncate">
                                    {row.txtValidTo || '---'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};