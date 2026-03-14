import React, { useState, useEffect } from 'react';
import { ProcessFilters } from '../components/ProcessFilters';
import { ProcessDetails } from '../components/ProcessDetails'; // ייבוא הקומפוננטה החדשה
import { Plus, Info, ArrowUpDown } from 'lucide-react';
import { apiRequest } from '../services/api';
import { toast } from 'sonner';

const COL_NAMES = [
    '', 'מזהה תהליך', 'מזהה בקשה', 'ממספר/בדיד', 'עד מספר/בדיד',
    'סוג תהליך', 'מצב תהליך', 'שלב תהליך', 'סיבת מעבר', 'קוד שגיאה',
    'מפעיל קולט', 'מפעיל ננטש', 'מועד ניוד מבוקש', 'תאריך יצירה',
    'תאריך עדכון אחרון', 'מספר מוביל קולט', 'מספר מוביל ננטש',
    'מספר מוחלף', 'פרופיל לקוח', 'מזהה לקוח', 'מספר הזמנה',
    'מספר קבוצה', 'הפצות חסרות', 'הפצות שנכשלו'
];

export default function ProcessManagement() {
    const [displayData, setDisplayData] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [userPermissions, setUserPermissions] = useState({ canAdd: false });
    const [hasSearched, setHasSearched] = useState(false);
    const [expandedRowId, setExpandedRowId] = useState<number | null>(null);

    const formatDateTime = (dateString: string) => {
        if (!dateString || dateString === '-') return { date: '-', time: '-' };
        const date = new Date(dateString);
        return {
            date: date.toLocaleDateString('he-IL'),
            time: date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit', hour12: false })
        };
    };

    const toggleRow = (id: number) => {
        setExpandedRowId(expandedRowId === id ? null : id);
    };

    useEffect(() => {
        const savedUser = sessionStorage.getItem("npg_user");
        if (savedUser) {
            const userData = JSON.parse(savedUser);
            setUserPermissions({
                canAdd: userData.permissions?.canAddProcess || false
            });
        }
    }, []);

    const handleFilter = async (filters: any) => {
        setIsLoading(true);
        setHasSearched(true);
        setExpandedRowId(null);

        const response = await apiRequest("/GetProcesses", filters);

        if (response && response.processes) {
            setDisplayData(response.processes);
        } else {
            // Mock data for development
            const mockData = Array.from({ length: 5 }).map((_, i) => ({
                id: i + 1,
                processId: `PRC-500${i}`,
                lrn: `D100${i}`,
                fromNum: `050-000000${i}`,
                toNum: `050-000000${i}`,
                type: 'ניוד רגיל',
                state: i % 2 === 0 ? 'פעיל' : 'הושלם',
                step: 'המתנה לאישור',
                reason: '-',
                errCode: '-',
                recOp: 'סלקום',
                abdOp: 'פרטנר',
                reqDate: '2026-03-15T10:00:00',
                createdAt: '2026-03-13T08:00:00',
                updatedAt: '2026-03-13T09:00:00',
                leadRec: '050-1112223',
                leadAbd: '052-4445556',
                replacedNum: '-',
                profile: 'פרטי',
                custId: '123456789',
                orderId: `ORD-${i}AB`,
                groupId: `G-${i}`,
                missDist: 0,
                failDist: 0
            }));
            setDisplayData(mockData);
        }
        setIsLoading(false);
    };

    return (
        <div className="p-4 bg-slate-50 min-h-screen font-sans" dir="rtl">
            <div className="max-w-[1600px] mx-auto flex justify-between items-end mb-4">
                <div>
                    <h1 className="text-lg font-bold text-slate-800">ניהול תהליכים</h1>
                    <p className="text-slate-400 text-[10px]">
                        {hasSearched ? `נמצאו ${displayData.length} תהליכים` : "אנא בצע חיפוש להצגת נתונים"}
                    </p>
                </div>

                {userPermissions.canAdd && (
                    <button
                        onClick={() => toast.info("פתיחת מודאל הוספה...")}
                        className="flex items-center gap-1 bg-[#1A365D] text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md hover:bg-[#254a7c] transition-all active:scale-95"
                    >
                        <Plus size={14} /> הוסף חדש
                    </button>
                )}
            </div>

            <div className="max-w-[1600px] mx-auto">
                <ProcessFilters onFilter={handleFilter} />

                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto overflow-y-auto max-h-[650px]">
                        <table className="w-full text-right border-collapse min-w-[3000px]">
                            <thead className="sticky top-0 z-10 bg-slate-50 shadow-sm">
                                <tr className="border-b border-slate-200">
                                    {COL_NAMES.map((col, idx) => (
                                        <th key={idx} className="p-3 font-bold text-slate-500 text-[11px] whitespace-nowrap border-l border-slate-100">
                                            <div className="flex items-center gap-1">
                                                {col}
                                                {col && <ArrowUpDown size={10} className="opacity-20" />}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-[12px]">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={COL_NAMES.length} className="p-20 text-center text-slate-400 font-bold text-sm">מעדכן נתונים...</td>
                                    </tr>
                                ) : !hasSearched ? (
                                    <tr>
                                        <td colSpan={COL_NAMES.length} className="p-24 text-center text-slate-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <span className="text-lg font-medium text-slate-600">ברוך הבא למערכת ניהול תהליכים</span>
                                                <span className="text-sm">אנא הזן פילטרים ולחץ על "בצע חיפוש" כדי להציג נתונים.</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    displayData.map((proc) => (
                                        <React.Fragment key={proc.id}>
                                            <tr className={`transition-colors group ${expandedRowId === proc.id ? 'bg-blue-50/60' : 'hover:bg-blue-50/40'}`}>
                                                <td className="p-2 text-center border-l border-slate-100">
                                                    <button
                                                        onClick={() => toggleRow(proc.id)}
                                                        className={`p-1 rounded-full transition-all ${expandedRowId === proc.id ? 'bg-blue-100 text-blue-600 rotate-90' : 'text-slate-300 hover:text-blue-500 hover:bg-slate-100'}`}
                                                    >
                                                        <Info size={16} />
                                                    </button>
                                                </td>
                                                <td className="p-2 border-l border-slate-100 font-bold">{proc.processId}</td>
                                                <td className="p-2 border-l border-slate-100 font-mono font-bold text-blue-700">{proc.lrn}</td>
                                                <td className="p-2 border-l border-slate-100">{proc.fromNum}</td>
                                                <td className="p-2 border-l border-slate-100">{proc.toNum}</td>
                                                <td className="p-2 border-l border-slate-100">{proc.type}</td>
                                                <td className="p-2 border-l border-slate-100">
                                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${proc.state === 'הושלם' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
                                                        {proc.state}
                                                    </span>
                                                </td>
                                                <td className="p-2 border-l border-slate-100">{proc.step}</td>
                                                <td className="p-2 border-l border-slate-100 text-slate-400">{proc.reason}</td>
                                                <td className="p-2 border-l border-slate-100 text-red-500">{proc.errCode}</td>
                                                <td className="p-2 border-l border-slate-100 font-semibold">{proc.recOp}</td>
                                                <td className="p-2 border-l border-slate-100 font-semibold">{proc.abdOp}</td>
                                                <td className="p-2 border-l border-slate-100">{formatDateTime(proc.reqDate).date}</td>
                                                <td className="p-2 border-l border-slate-100">{formatDateTime(proc.createdAt).date} {formatDateTime(proc.createdAt).time}</td>
                                                <td className="p-2 border-l border-slate-100">{formatDateTime(proc.updatedAt).date} {formatDateTime(proc.updatedAt).time}</td>
                                                <td className="p-2 border-l border-slate-100">{proc.leadRec}</td>
                                                <td className="p-2 border-l border-slate-100">{proc.leadAbd}</td>
                                                <td className="p-2 border-l border-slate-100">{proc.replacedNum}</td>
                                                <td className="p-2 border-l border-slate-100">{proc.profile}</td>
                                                <td className="p-2 border-l border-slate-100">{proc.custId}</td>
                                                <td className="p-2 border-l border-slate-100">{proc.orderId}</td>
                                                <td className="p-2 border-l border-slate-100 font-bold">{proc.groupId}</td>
                                                <td className="p-2 border-l border-slate-100 text-center">{proc.missDist}</td>
                                                <td className="p-2 text-center font-bold text-red-500">{proc.failDist}</td>
                                            </tr>

                                            {expandedRowId === proc.id && (
                                                <tr className="bg-slate-50 shadow-inner animate-in fade-in slide-in-from-top-1 duration-200">
                                                    <td colSpan={COL_NAMES.length} className="p-0 border-b-2 border-blue-200">
                                                        {/* קריאה לקומפוננטה המופרדת */}
                                                        <ProcessDetails proc={proc} />
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="bg-slate-50 p-2 px-4 border-t border-slate-100 text-[10px] text-slate-400 font-medium italic">
                        * ניתן להרחיב כל שורה בלחיצה על כפתור ה-Info לצפייה בפרטים מורחבים.
                    </div>
                </div>
            </div>
        </div>
    );
}