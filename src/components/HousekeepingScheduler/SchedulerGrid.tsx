import React, { useMemo, useState } from 'react';
import { Play, Pencil, Trash2, Search, Calendar, Clock as ClockIcon, Activity, RefreshCw, ArrowUpDown, ChevronUp, ChevronDown } from 'lucide-react';

interface SchedulerGridProps {
    data: any[];
    loading: boolean;
    onViewHistory: (taskId: string) => void;
    onRefresh: () => void;
    onEdit: (task: any) => void;
    onAction: (taskId: string, mode: 'ACTIVATE' | 'DELETE') => void;
}

export const SchedulerGrid: React.FC<SchedulerGridProps> = ({
    data, loading, onViewHistory, onEdit, onAction
}) => {

    const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({
        key: 'nextActivationDate', // ברירת מחדל
        direction: 'asc'
    });

    // פונקציית עזר להמרת תאריך טיבקו לערך מספרי
    const parseDate = (dateStr: string) => {
        if (!dateStr || typeof dateStr !== 'string') return 0;
        const cleanStr = dateStr.trim().replace(/\s+/g, ' ');
        const [datePart, timePart] = cleanStr.split(' ');
        const [day, month, year] = datePart.split('/');
        const [hour, minute] = (timePart || "00:00").split(':');
        return new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute)).getTime();
    };

    // לוגיקת המיון המרכזית
    const sortedData = useMemo(() => {
        let sortableItems = [...(data || [])];
        if (sortConfig.key) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // טיפול מיוחד בתאריכים
                if (sortConfig.key === 'nextActivationDate') {
                    return sortConfig.direction === 'asc'
                        ? parseDate(aValue) - parseDate(bValue)
                        : parseDate(bValue) - parseDate(aValue);
                }

                // מיון טקסטואלי (שם פעולה וכד')
                aValue = (aValue || "").toString().toLowerCase();
                bValue = (bValue || "").toString().toLowerCase();

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [data, sortConfig]);

    const requestSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    // פונקציית עזר להצגת האייקון של המיון בכותרת
    const getSortIcon = (key: string) => {
        if (sortConfig.key !== key) return <ArrowUpDown size={12} className="opacity-30" />;
        return sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
    };

    if (loading) return <div className="p-20 text-center animate-pulse">טוען...</div>;

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="p-4 text-[13px] font-bold text-slate-600 w-28 text-center">פעולות</th>

                        {/* כותרת שם פעולה עם מיון */}
                        <th
                            className="p-4 text-[13px] font-bold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors"
                            onClick={() => requestSort('activationName')}
                        >
                            <div className="flex items-center gap-2">
                                שם פעולה {getSortIcon('activationName')}
                            </div>
                        </th>

                        <th className="p-4 text-[13px] font-bold text-slate-600">תיאור משימה</th>
                        <th className="p-4 text-[13px] font-bold text-slate-600">קלט</th>
                        <th className="p-4 text-[13px] font-bold text-slate-600">מחזוריות</th>

                        {/* כותרת הפעלה הבאה עם מיון */}
                        <th
                            className="p-4 text-[13px] font-bold text-slate-600 cursor-pointer hover:bg-slate-100 transition-colors"
                            onClick={() => requestSort('nextActivationDate')}
                        >
                            <div className="flex items-center gap-2">
                                הפעלה הבאה {getSortIcon('nextActivationDate')}
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[12px]">
                    {sortedData.map((task, idx) => (
                        <tr key={task.taskID || idx} className="hover:bg-blue-50/30 transition-colors">
                            <td className="p-3">
                                <div className="flex items-center justify-center gap-1">
                                    <button onClick={() => onAction(task.taskID, 'DELETE')} className="p-1 hover:text-red-600" title="מחיקת משימה"><Trash2 size={16} /></button>
                                    <button onClick={() => onViewHistory(task.taskID)} className="p-1 hover:text-slate-700" title="היסטוריית ריצות"><Search size={16} /></button>
                                    <button onClick={() => onEdit(task)} className="p-1 hover:text-blue-600" title="עריכת משימה"><Pencil size={16} /></button>
                                    <button onClick={() => onAction(task.taskID, 'ACTIVATE')} className="p-1 hover:text-emerald-600" title="הפעלה מיידית"><Play size={16} /></button>
                                </div>
                            </td>
                            <td className="p-4 font-bold text-slate-700">{task.activationName}</td>
                            <td className="p-4">{task.taskDesc}</td>
                            <td className="p-4 min-w-[150px]"><div className="bg-slate-50 p-1 rounded font-mono text-[10px] break-all">{task.actionParams || "-"}</div></td>
                            <td className="p-4 flex items-center gap-1 text-slate-500"><RefreshCw size={12} /> {task.activationMode}</td>
                            <td className="p-4 font-bold text-slate-700">{task.nextActivationDate}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};