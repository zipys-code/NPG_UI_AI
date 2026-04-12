import React, { useState, useMemo } from 'react';
import { FileDown, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import * as XLSX from 'xlsx';

export const DnRouteNumbersGrid = ({ data, loading }) => {
    // מצב לניהול המיון: איזה שדה ואיזה כיוון
    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' | null }>({
        key: '',
        direction: null
    });

    // פונקציה לביצוע המיון
    const handleSort = (key: string) => {
        console.log("Sorting by:", key)
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // חישוב הנתונים הממוינים (משתנה רק כשמקור הנתונים או הגדרות המיון משתנות)
    const sortedData = useMemo(() => {
        const sortableItems = [...data];
        if (sortConfig.direction !== null) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                if (sortConfig.key === 'ValidFrom') {
                    const convertToDateValue = (dateStr: string) => {
                        if (!dateStr || typeof dateStr !== 'string') return 0;

                        const nums = dateStr.match(/\d+/g);
                        if (!nums || nums.length < 5) return 0;

                        // חילוץ לפי הסדר שמופיע בסטרינג: HH, mm, DD, MM, YYYY
                        const [hh, mm, day, month, year] = nums;

                        // יצירת אובייקט תאריך תקין: (year, monthIndex, day, hours, minutes)
                        // שימי לב: חודש ב-JS מתחיל מ-0, לכן מפחיתים 1
                        return new Date(
                            parseInt(year),
                            parseInt(month) - 1,
                            parseInt(day),
                            parseInt(hh),
                            parseInt(mm)
                        ).getTime();
                    };

                    aValue = convertToDateValue(aValue);
                    bValue = convertToDateValue(bValue);
                }

                // השוואה מספרית/טקסטואלית
                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [data, sortConfig]);

    // פונקציית עזר להצגת האייקון המתאים בכותרת
    const getSortIcon = (key: string) => {
        if (sortConfig.key !== key) return <ArrowUpDown size={12} className="text-slate-300" />;
        return sortConfig.direction === 'asc' ?
            <ArrowUp size={12} className="text-blue-600" /> :
            <ArrowDown size={12} className="text-blue-600" />;
    };

    const exportToExcel = () => {
        const worksheet = XLSX.utils.json_to_sheet(sortedData); // מייצא את המיון הנוכחי
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "נתוני ניוד");
        XLSX.writeFile(workbook, `Dn_Route_Numbers.xlsx`);
    };

    if (loading) return <div className="p-10 text-center text-slate-500">טוען...</div>;

    return (
        <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 flex justify-between items-center border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800">תוצאות ({data.length})</h3>
                <button
                    onClick={exportToExcel}
                    className="flex items-center gap-2 bg-[#107c41] hover:bg-[#0a5c30] text-white px-3 py-1.5 rounded-md text-sm font-bold transition-colors shadow-sm"
                >
                    <FileDown size={16} />
                    ייצוא לאקסל
                </button>
            </div>

            <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-right border-collapse">
                    <thead className="sticky top-0 bg-slate-50 z-10 border-b border-slate-200">
                        <tr className="text-slate-500 text-[11px] font-bold uppercase tracking-wider">
                            {[
                                { label: 'מספר', key: 'DNfrom' },
                                { label: 'עד מספר', key: 'DNto' },
                                { label: 'סוג הרשת', key: 'NetworkType' },
                                { label: 'מפעיל נטש', key: 'Pno' },
                                { label: 'מפעיל קולט', key: 'Cno' },
                                { label: 'תאריך ניוד', key: 'ValidFrom' },
                                { label: 'מזהה בקשה', key: 'RequestID' },
                                { label: 'סוג מספר', key: 'RouteType' }
                            ].map((col) => (
                                <th
                                    key={col.key}
                                    onClick={() => handleSort(col.key)}
                                    className="p-3 border-l border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span>{col.label}</span>
                                        {getSortIcon(col.key)}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {sortedData.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors text-[11px] text-slate-700">
                                <td className="p-3 border-l border-slate-50 font-bold">{row.DNfrom}</td>
                                <td className="p-3 border-l border-slate-50">{row.DNto}</td>
                                <td className="p-3 border-l border-slate-50">{row.NetworkType}</td>
                                <td className="p-3 border-l border-slate-50">{row.Pno}</td>
                                <td className="p-3 border-l border-slate-50">{row.Cno}</td>
                                <td className="p-3 border-l border-slate-50">{row.ValidFrom}</td>
                                <td className="p-3 border-l border-slate-50 text-blue-600 font-mono">{row.RequestID}</td>
                                <td className="p-3 uppercase text-slate-400">{row.RouteType}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};