import React, { useState } from "react";
import { Plus, List, Loader2, FileDown, Wrench } from "lucide-react";
import { ProcessFilters } from "@/components/ProcessFilters";
import { searchProcesses, getProcessManipulation, setProcesses, setAddProcess } from "@/services/api";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import { ProcessDetails } from "@/components/ProcessDetails";
import { ProcessActionModal } from "@/components/ProcessActionModal";
import { AddProcessModal } from "@/components/AddProcessModal";
import * as XLSX from 'xlsx';

interface ProcessManagementProps {
    mode: 'VIEW' | 'MANAGE';
}

export default function ProcessManagement({ mode = 'VIEW' }: ProcessManagementProps) {
    const isManageMode = mode === 'MANAGE';
    const { currentNetworkId, currentNetworkName, currentUser } = useApp();
    const [results, setResults] = useState<any[]>([]);
    const [searched, setSearched] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);
    const [lastFilters, setLastFilters] = useState<any>(null);

    // State לניהול בחירת שורות
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    // States חדשים לניהול המודאל
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);
    const [manipulationData, setManipulationData] = useState<any>(null);

    const handleSearch = async (filterValues: any) => {
        setIsLoading(true);
        setResults([]);
        setSelectedIds([]); // איפוס בחירות בחיפוש חדש
        setLastFilters(filterValues);
        try {
            const response = await searchProcesses(filterValues, currentNetworkId || "320");
            const getOut = response?.root?.getOut;
            const notification = Array.isArray(getOut?.notification?.msg)
                ? getOut.notification.msg[0]
                : getOut?.notification?.msg;

            if (notification?.code === "1000") {
                const data = getOut?.data?.dataGrid?.row || [];
                const finalData = Array.isArray(data) ? data : [data];
                setResults(finalData);
                setSearched(true);
            } else {
                toast.error(`${notification?.msgBody || "שגיאה בחיפוש"} (${notification?.code || ''})`);
            }
        } catch (err) {
            console.error("Search Error:", err);
            toast.error("שגיאת תקשורת בביצוע החיפוש");
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setResults([]);
        setSearched(false);
        setExpandedRow(null);
        setSelectedIds([]);
    };

    const toggleRow = (id: string) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(results.map(row => row.requestId));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectRow = (id: string) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleExportExcel = () => {
        if (results.length === 0) return;
        const headerInfo = [
            ["דו\"ח ניהול תהליכים - מערכת NPG"],
            [`תאריך הפקה: ${new Date().toLocaleString('he-IL')}`],
            ["פילטרים בשימוש:"],
            [`מזהה בקשה: ${lastFilters?.requestId || 'הכל'} | מספר תהליך: ${lastFilters?.processId || 'הכל'} | מתאריך: ${lastFilters?.fromDateTime} | עד תאריך: ${lastFilters?.toDateTime}`],
            [],
        ];

        const columns = [
            "מזהה בקשה", "מספר תהליך", "מספר/בדיד", "עד מספר", "סוג תהליך", "מצב תהליך",
            "שלב תהליך", "סיבת מעבר", "קוד שגיאה", "מפעיל קולט", "מפעיל ננטש",
            "מועד ניוד מבוקש", "תאריך יצירה", "עדכון אחרון", "מוביל קולט", "מוביל ננטש",
            "מספר מוחלף", "פרופיל לקוח", "מזהה לקוח", "מספר הזמנה", "מספר קבוצה",
            "הפצות חסרות", "הפצות שכשלו"
        ];

        const rows = results.map(row => [
            row.requestId, row.processId, row.phoneNumber, row.dnTo, row.processType,
            row.parentStatus, row.state, row.reasonCode, row.errorCode, row.recipientNetwork,
            row.donorNetwork, row.requestExecDate, row.createDate, row.lastUpdateDate,
            row.leadRec, row.leadAbd, row.replacedNum, row.customerProfile, row.customerId,
            row.orderId, row.groupId, row.missDist, row.failDist
        ]);

        const worksheet = XLSX.utils.aoa_to_sheet([...headerInfo, columns, ...rows]);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "תוצאות חיפוש");
        XLSX.writeFile(workbook, `NPG_Export_${new Date().toLocaleDateString('he-IL').replace(/\./g, '_')}.xlsx`);
    };

    const handleProcessManipulation = async () => {
        if (selectedIds.length === 0) return;

        // מציאת ה-processId המתאים עבור כל requestId שנבחר (השרת מצפה ל-processID)
        const processIdsToSend = results
            .filter(row => selectedIds.includes(row.requestId))
            .map(row => row.processId);

        setIsLoading(true);
        try {
            const response = await getProcessManipulation(processIdsToSend, currentNetworkId);

            // --- חילוץ בטוח של הנתונים מתוך המבנה של טיבקו ---
            // תלוי איך apiRequest מחזיר את התגובה, לרוב זה יהיה בתוך .root
            const getOut = response?.root?.getOut || response?.getOut || response;
            const notification = getOut?.notification;

            // המרת msgCode למספר לביטחון (לפעמים חוזר כסטרינג)
            const code = Number(notification?.msgCode);

            console.log("Manipulation Response Code:", code); // לבדיקה בקונסול

            if (code === 1000) {
                setManipulationData(getOut.data);
                setIsActionModalOpen(true);
            } else {
                // אם הגענו לכאן והקוד ריק, זה אומר שהנתיב ל-notification לא נכון
                toast.error(`${notification?.msgBody || "שגיאה בטעינת נתוני תפעול"} (${notification?.msgCode || ''})`);
            }
        } catch (err) {
            console.error("Manipulation Error:", err);
            toast.error("שגיאת תקשורת בביצוע הפעולה");
        } finally {
            setIsLoading(false);
        }
    };

    const handleActionExecute = async (actionId: string, groupId?: string, additionalData?: any) => {
        // 1. אישור משתמש
        if (!window.confirm("אנא אשר/י ביצוע פעולה")) return;

        // 2. הכנת מזהים
        const selectedProcesses = results
            .filter(row => selectedIds.includes(row.requestId))
            .map(row => ({
                processId: row.processId,
                requestId: row.requestId
            }));

        let modeApi = "State";
        let targetStateApi = actionId;
        let republishListApi = "";

        // תיקון לוגיקת ה-MODE והנתונים
        if (actionId === 'M0.1') modeApi = "Terminate";
        if (actionId === 'SET_GROUP') modeApi = "ArbitraryID";
        if (actionId === 'UPDATE_DATES') modeApi = "Date";

        // טיפול מיוחד ב-REPUBLISH
        if (actionId === 'REPUBLISH') {
            modeApi = "republish"; // לפי ה-Payload הישן שמצאת
            targetStateApi = "";   // לפי ה-Payload הישן
            republishListApi = additionalData?.republishList || ""; // שליפת הרשימה מהמודאל
        }

        setIsLoading(true);
        try {
            const response = await setProcesses({
                mode: modeApi,
                processes: selectedProcesses,
                targetState: actionId,
                groupId: groupId,
                selfNetworkId: currentNetworkId || "320",
                roleId: currentUser?.roleId || "NPG_ADMINISTRATOR",
                userName: currentUser?.name || "אורח",
                portingData: actionId === 'UPDATE_DATES' ? additionalData : null,
                republishList: republishListApi
            });

            const setOut = response?.setOut || response;

            setManipulationData((prev: any) => ({
                ...prev,
                notifications: setOut?.notifications,
                validationNotifications: setOut?.validationNotifications
            }));

            // איסוף הודעות ל-Toast (אופציונלי, אפשר להשאיר רק במודאל)
            const allMsgs = [
                ...(setOut?.notifications?.item || []),
                ...(setOut?.validationNotifications?.item || [])
            ].filter(m => m.msgBody && m.msgBody !== "null");

            if (allMsgs.length > 0) {
                // אם יש הצלחה (קוד 1000), נרענן את הטבלה ברקע אבל לא נסגור את המודאל מיד
                const hasSuccess = allMsgs.some((m: any) => m.msgCode === "1000" || m.msgCode === 1000);

                if (hasSuccess) {
                    // רק אם הכל הצליח פיקס, אולי נרצה לסגור. 
                    // בדרך כלל בשגיאות (כמו שראית), עדיף להשאיר פתוח כדי שיראו את השגיאה.
                    //toast.success("הפעולה בוצעה, ראה פירוט במודאל");
                    handleSearch(lastFilters);
                }
            }

        } catch (err) {
            toast.error("שגיאת תקשורת בביצוע הפעולה");
        } finally {
            setIsLoading(false);
        }
    };

    // בתוך ProcessManagement.tsx

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const handleAddNewProcess = async (formData: any) => {
        setIsLoading(true);
        try {
            const response = await setAddProcess({
                ...formData,
                selfNetworkId: currentNetworkId || "320",
                userName: currentUser?.name || "System"
            });

            const notification = response?.root?.setOut?.notification || response?.setOut?.notification;

            if (notification?.msg?.severity?.$ === "SUCCESS") {
                toast.success("תהליך חדש נוצר בהצלחה!");
                setIsAddModalOpen(false);
                handleSearch(lastFilters); // רענון הטבלה
            } else {
                toast.error(notification?.msg?.msgBody?.$ || "שגיאה ביצירת תהליך");
            }
        } catch (err) {
            toast.error("שגיאת תקשורת");
        } finally {
            setIsLoading(false);
        }
    };



    return (
        <div className="flex-1 p-6 overflow-auto" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <List size={20} className="text-slate-400" />
                    <h2 className="text-xl font-bold text-slate-800">{!isManageMode ? "צפייה בתהליכים" : "ניהול תהליכים"}</h2>
                </div>
                {isManageMode && (
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors shadow-md"
                    >
                        <Plus size={16} />
                        <span>הוסף תהליך חדש</span>
                    </button>
                )}
            </div>

            <ProcessFilters onFilter={handleSearch} onReset={handleReset} />

            {isLoading && !isActionModalOpen && (
                <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
            )}

            {searched && !isLoading && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="text-sm font-bold text-slate-700">
                            תוצאות ({results.length})
                        </h3>
                        <div className="flex gap-2">
                            {isManageMode && (
                                <button
                                    disabled={selectedIds.length === 0 || isLoading}
                                    onClick={handleProcessManipulation}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all shadow-sm
                                    ${selectedIds.length > 0 && !isLoading
                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                                >
                                    {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Wrench size={14} />}
                                    טיפול בתהליכים ({selectedIds.length})
                                </button>
                            )}
                            {results.length > 0 && (
                                <button
                                    onClick={handleExportExcel}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-md text-xs font-bold hover:bg-green-700 transition-colors shadow-sm"
                                >
                                    <FileDown size={14} />
                                    ייצוא לאקסל
                                </button>
                            )}
                        </div>
                    </div>

                    {results.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-right text-sm">
                                <thead>
                                    <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 whitespace-nowrap text-[10px]">
                                        {isManageMode && (
                                            <th className="w-10 px-2 py-2 border-l border-slate-200 text-center">
                                                <input
                                                    type="checkbox"
                                                    onChange={handleSelectAll}
                                                    checked={selectedIds.length === results.length && results.length > 0}
                                                />
                                            </th>
                                        )}
                                        <th className="w-8 px-2 py-2 border-l border-slate-200"></th>
                                        <th className="px-2 py-2 font-bold border-l border-slate-200">מזהה בקשה</th>
                                        <th className="px-2 py-2 font-bold border-l border-slate-200">מספר תהליך</th>
                                        <th className="px-2 py-2 font-bold border-l border-slate-200">מספר/בדיד</th>
                                        <th className="px-2 py-2 font-bold border-l border-slate-200">עד מספר</th>
                                        <th className="px-2 py-2 font-bold border-l border-slate-200">סוג תהליך</th>
                                        <th className="px-2 py-2 font-bold border-l border-slate-200">מצב תהליך</th>
                                        <th className="px-2 py-2 font-bold border-l border-slate-200">שלב תהליך</th>
                                        <th className="px-2 py-2 font-bold border-l border-slate-200">סיבת מעבר</th>
                                        <th className="px-2 py-2 font-bold border-l border-slate-200">קוד שגיאה</th>
                                        <th className="px-2 py-2 font-bold border-l border-slate-200">מפעיל קולט</th>
                                        <th className="px-2 py-2 font-bold border-l border-slate-200">מפעיל ננטש</th>
                                        <th className="px-2 py-2 font-bold border-l border-slate-200">מועד ניוד מבוקש</th>
                                        <th className="px-2 py-2 font-bold border-l border-slate-200">תאריך יצירה</th>
                                        <th className="px-2 py-2 font-bold border-l border-slate-200">עדכון אחרון</th>
                                        <th className="px-2 py-2 font-bold border-l border-slate-200">מוביל קולט</th>
                                        <th className="px-2 py-2 font-bold border-l border-slate-200">מוביל ננטש</th>
                                        <th className="px-2 py-2 font-bold border-l border-slate-200">מספר מוחלף</th>
                                        <th className="px-2 py-2 font-bold border-l border-slate-200">פרופיל לקוח</th>
                                        <th className="px-2 py-2 font-bold border-l border-slate-200">מזהה לקוח</th>
                                        <th className="px-2 py-2 font-bold border-l border-slate-200">מספר הזמנה</th>
                                        <th className="px-2 py-2 font-bold border-l border-slate-200">מספר קבוצה</th>
                                        <th className="px-2 py-2 font-bold border-l border-slate-200">הפצות חסרות</th>
                                        <th className="px-2 py-2 font-bold">הפצות שכשלו</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200 text-[10px]">
                                    {results.map((row, index) => (
                                        <React.Fragment key={row.requestId || index}>
                                            <tr
                                                className={`hover:bg-blue-50 transition-colors cursor-pointer ${index % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}
                                                onClick={() => toggleRow(row.requestId)}
                                            >
                                                {isManageMode && (
                                                    <td className="px-2 py-2 border-l border-slate-100 text-center" onClick={(e) => e.stopPropagation()}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedIds.includes(row.requestId)}
                                                            onChange={() => handleSelectRow(row.requestId)}
                                                        />
                                                    </td>
                                                )}

                                                <td className="px-2 py-2 text-blue-500 font-bold text-center border-l border-slate-100 bg-slate-50/50">
                                                    {expandedRow === row.requestId ? '▲' : '▼'}
                                                </td>

                                                <td className="px-2 py-2 font-medium text-blue-700 whitespace-nowrap border-l border-slate-100">{row.requestId}</td>
                                                <td className="px-2 py-2 border-l border-slate-100">{row.processId}</td>
                                                <td className="px-2 py-2 font-bold border-l border-slate-100">{row.phoneNumber}</td>
                                                <td className="px-2 py-2 border-l border-slate-100">{row.dnTo || ''}</td>
                                                <td className="px-2 py-2 whitespace-nowrap border-l border-slate-100">{row.processType}</td>
                                                <td className="px-2 py-2 border-l border-slate-100 text-center">
                                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${row.parentStatus === 'TERMINATED_SUCCESSFULLY' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700'}`}>
                                                        {row.parentStatus}
                                                    </span>
                                                </td>
                                                <td className="px-2 py-2 border-l border-slate-100">{row.state}</td>
                                                <td className="px-2 py-2 border-l border-slate-100 text-slate-500">{row.reasonCode}</td>
                                                <td className="px-2 py-2 border-l border-slate-100 text-red-600 font-bold">{row.errorCode || ''}</td>
                                                <td className="px-2 py-2 border-l border-slate-100">{row.recipientNetwork}</td>
                                                <td className="px-2 py-2 border-l border-slate-100">{row.donorNetwork}</td>
                                                <td className="px-2 py-2 border-l border-slate-100 whitespace-nowrap">{row.requestExecDate || ''}</td>
                                                <td className="px-2 py-2 border-l border-slate-100 whitespace-nowrap">{row.createDate}</td>
                                                <td className="px-2 py-2 border-l border-slate-100 whitespace-nowrap">{row.lastUpdateDate}</td>
                                                <td className="px-2 py-2 border-l border-slate-100">{row.leadRec || ''}</td>
                                                <td className="px-2 py-2 border-l border-slate-100">{row.leadAbd || ''}</td>
                                                <td className="px-2 py-2 border-l border-slate-100">{row.replacedNum || ''}</td>
                                                <td className="px-2 py-2 border-l border-slate-100">{row.customerProfile || ''}</td>
                                                <td className="px-2 py-2 border-l border-slate-100">{row.customerId || ''}</td>
                                                <td className="px-2 py-2 border-l border-slate-100">{row.orderId || ''}</td>
                                                <td className="px-2 py-2 border-l border-slate-100">{row.groupId || '0'}</td>
                                                <td className="px-2 py-2 border-l border-slate-100 text-center">{row.missDist || 0}</td>
                                                <td className="px-2 py-2 text-center text-red-600">{row.failDist || 0}</td>
                                            </tr>
                                            {expandedRow === row.requestId && (
                                                <tr>
                                                    <td colSpan={26} className="bg-slate-100/50 p-4 border-b border-slate-300 shadow-inner">
                                                        <ProcessDetails proc={row} />
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-12 text-center text-slate-500 italic">לא נמצאו תוצאות לחיפוש זה</div>
                    )}
                </div>
            )}

            {/* המודאל החדש בסוף הקומפוננטה */}
            <ProcessActionModal
                isOpen={isActionModalOpen}
                onClose={() => setIsActionModalOpen(false)}
                data={manipulationData}
                onActionExecute={handleActionExecute}
            />

            <AddProcessModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSave={handleAddNewProcess}
            />
        </div>
    );
}