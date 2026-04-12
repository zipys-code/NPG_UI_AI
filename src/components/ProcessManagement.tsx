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
  mode?: 'VIEW' | 'MANAGE';
}

export default function ProcessManagement({ mode = 'MANAGE' }: ProcessManagementProps) {
  const isManageMode = mode === 'MANAGE';
  const { currentNetworkId, currentUser } = useApp();

  // --- States ---
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [lastFilters, setLastFilters] = useState<any>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [manipulationData, setManipulationData] = useState<any>(null);

  // --- לוגיקת חיפוש ---
  const handleSearch = async (filterValues: any) => {
    setIsLoading(true);
    setResults([]);
    setSelectedIds([]);
    setLastFilters(filterValues);
    try {
      const response = await searchProcesses(filterValues, currentNetworkId || "320");
      const resData = response?.root?.getOut || response?.getOut || response;
      const notification = Array.isArray(resData?.notification?.msg)
        ? resData.notification.msg[0]
        : resData?.notification?.msg;

      if (notification?.code === "1000" || notification?.msgCode === "1000") {
        const data = resData?.data?.dataGrid?.row || resData?.data?.row || [];
        const finalData = Array.isArray(data) ? data : [data];
        setResults(finalData);
        setSearched(true);
      } else {
        toast.error(`${notification?.msgBody || "שגיאה בחיפוש"} (${notification?.code || ''})`);
      }
    } catch (err) {
      toast.error("שגיאת תקשורת בביצוע החיפוש");
    } finally {
      setIsLoading(false);
    }
  };

  // --- ייצוא לאקסל ---
  const handleExportExcel = () => {
    if (results.length === 0) return;
    const columns = ["מזהה בקשה", "מספר תהליך", "מספר/בדיד", "מצב תהליך", "שלב תהליך"];
    const rows = results.map(row => [row.requestId, row.processId, row.phoneNumber, row.parentStatus, row.state]);
    const worksheet = XLSX.utils.aoa_to_sheet([columns, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "תוצאות");
    XLSX.writeFile(workbook, `NPG_Export.xlsx`);
  };

  // --- פתיחת מודאל תפעול (התיקון שעבדנו עליו!) ---
  const handleProcessManipulation = async () => {
    if (selectedIds.length === 0) return;

    const processListForApi = results
      .filter(row => selectedIds.includes(String(row.requestId)))
      .map(row => ({
        processID: String(row.processId),
        requestID: String(row.requestId)
      }));

    setIsLoading(true);
    try {
      const response = await getProcessManipulation(processListForApi, currentNetworkId);
      const resData = response?.root?.getOut || response?.getOut || response;

      if (Number(resData?.notification?.msgCode || resData?.notification?.code) === 1000) {
        setManipulationData(resData.data);
        setIsActionModalOpen(true);
      } else {
        toast.error("שגיאה בטעינת נתוני תפעול");
      }
    } catch (err) {
      toast.error("שגיאת תקשורת");
    } finally {
      setIsLoading(false);
    }
  };

  // --- ביצוע פעולה ---
  const handleActionExecute = async (actionId: string, groupId?: string, additionalData?: any) => {

    // ולידציה למזהה קבוצת טיפול (ArbitraryID)
    if (actionId === 'SET_GROUP' && (!groupId || groupId.trim() === "")) {
      toast.error("יש למלא ערך בשדה מזהה קבוצת טיפול");
      return;
    }

    // ולידציה כללית - ודוא שיש תהליכים נבחרים
    if (selectedIds.length === 0) {
      toast.error("לא נבחרו תהליכים לביצוע");
      return;
    }

    const confirmMessage = actionId === 'M0.1'
      ? "האם את/ה בטוח שברצונך לבטל (Terminate) את התהליכים הנבחרים?"
      : "אנא אשר/י ביצוע פעולה על התהליכים הנבחרים";

    if (!window.confirm(confirmMessage)) return;

    const selectedProcesses = results
      .filter(row => selectedIds.includes(String(row.requestId)))
      .map(row => ({ processId: row.processId, requestId: row.requestId }));

    let modeApi = "State";
    let targetStateApi = actionId;
    let republishListApi = "";

    if (actionId === 'M0.1') modeApi = "Terminate";
    if (actionId === 'SET_GROUP') modeApi = "ArbitraryID";

    // טיפול מיוחד ב-REPUBLISH
    if (actionId === 'REPUBLISH') {
      modeApi = "republish"; // לפי ה-Payload הישן שמצאת
      targetStateApi = "";   // לפי ה-Payload הישן
      republishListApi = additionalData?.republishList || ""; // שליפת הרשימה מהמודאל
    }

    setIsLoading(true);
    try {
      const response = await setProcesses({
        mode: mode,
        processes: selectedProcesses,
        targetState: actionId,
        groupId: groupId,
        selfNetworkId: currentNetworkId || "322",
        roleId: currentUser?.roleId || "NPG_ADMINISTRATOR",
        userName: currentUser?.name || "אורח",
        portingData: actionId === 'UPDATE_DATES' ? additionalData : null,
        republishList: republishListApi

      });

      const setOut = response?.setOut || response;

      // --- התיקון הקריטי כאן ---
      // אנחנו מעדכנים את הנתונים של המודאל עם התגובה החדשה מהשרת
      // זה יגרום למודאל להתרנדר מחדש ולהציג את ה-notifications בתחתית
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
          toast.success("הפעולה בוצעה, ראה פירוט במודאל");
          handleSearch(lastFilters);
        }
      }
    } catch (err) {
      toast.error("שגיאת תקשורת");
    } finally {
      setIsLoading(false);
    };
  }

  const handleAddNewProcess = async (formData: any) => {
    const response = await setAddProcess(formData, { currentNetworkId, currentUser });
    if (lastFilters) handleSearch(lastFilters);
    return response;
  };

  return (
    <div className="flex-1 p-6 overflow-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <List size={20} className="text-slate-400" />
          <h2 className="text-xl font-bold text-slate-800">{!isManageMode ? "צפייה בתהליכים" : "ניהול תהליכים"}</h2>
        </div>
        {isManageMode && (
          <button onClick={() => setIsAddModalOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md">
            <Plus size={16} /> הוסף תהליך חדש
          </button>
        )}
      </div>

      <ProcessFilters onFilter={handleSearch} onReset={() => { setResults([]); setSearched(false); }} />

      {searched && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm mt-6 overflow-hidden">
          <div className="px-6 py-4 border-b bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-700">תוצאות ({results.length})</h3>
            <div className="flex gap-2">
              {isManageMode && (
                <button disabled={selectedIds.length === 0} onClick={handleProcessManipulation} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold ${selectedIds.length > 0 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400'}`}>
                  <Wrench size={14} /> טיפול ({selectedIds.length})
                </button>
              )}
              <button onClick={handleExportExcel} className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-md text-xs font-bold"><FileDown size={14} /> אקסל</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 whitespace-nowrap text-[10px]">
                  {/* 1. בחירה - רק בניהול */}
                  {isManageMode && (
                    <th className="w-10 px-2 py-2 border-l border-slate-200 text-center">
                      <input
                        type="checkbox"
                        onChange={(e) => {
                          if (e.target.checked) setSelectedIds(results.map(row => row.requestId));
                          else setSelectedIds([]);
                        }}
                        checked={selectedIds.length === results.length && results.length > 0}
                      />
                    </th>
                  )}

                  {/* 2. חץ הרחבה - תמיד מופיע */}
                  <th className="w-8 px-2 py-2 border-l border-slate-200"></th>

                  {/* 3. עמודות הנתונים (22 עמודות) */}
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
                      onClick={() => setExpandedRow(expandedRow === row.requestId ? null : row.requestId)}
                    >
                      {/* 1. Checkbox רק בניהול */}
                      {isManageMode && (
                        <td className="px-2 py-2 border-l border-slate-100 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(row.requestId)}
                            onChange={() => setSelectedIds(prev => prev.includes(row.requestId) ? prev.filter(id => id !== row.requestId) : [...prev, row.requestId])}
                          />
                        </td>
                      )}

                      {/* 2. חץ הרחבה כחול */}
                      <td className="px-2 py-2 text-blue-500 font-bold text-center border-l border-slate-100 bg-slate-50/50">
                        {expandedRow === row.requestId ? '▲' : '▼'}
                      </td>

                      {/* 3. גוף הנתונים - כל 22 העמודות */}
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

                    {/* 4. שורה מתרחבת (Details) */}
                    {expandedRow === row.requestId && (
                      <tr>
                        <td colSpan={isManageMode ? 25 : 24} className="bg-slate-100/50 p-4 border-b border-slate-300 shadow-inner">
                          <ProcessDetails proc={row} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ProcessActionModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        data={manipulationData}
        onActionExecute={handleActionExecute}
      />
      <AddProcessModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onSave={handleAddNewProcess} />
    </div>
  );
}