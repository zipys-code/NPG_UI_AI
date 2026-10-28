import React, { useState } from "react";
import { Plus, List, Loader2, FileDown, Wrench, MessageSquare } from "lucide-react";
import { ProcessFilters } from "@/components/Process/ProcessFilters";
import { searchProcesses, getProcessManipulation, setProcesses, setAddProcess } from "@/services/api";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import { ProcessDetails } from "@/components/Process/ProcessDetails";
import { ProcessActionModal } from "@/components/Process/ProcessActionModal";
import { AddProcessModal } from "@/components/Process/AddProcessModal";
import * as XLSX from 'xlsx';
import { MessagesModal } from "../Messages/MessagesModal";
import { useLocation } from "react-router-dom";

interface ProcessManagementProps {
  mode?: 'VIEW' | 'MANAGE';
}

export default function ProcessManagement({ mode = 'MANAGE' }: ProcessManagementProps) {
  const isManageMode = mode === 'MANAGE';
  const { currentNetworkId, currentUser, token, roleId } = useApp();

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
  const [isFilterOpen, setIsFilterOpen] = useState(true);

  //--- message modal states ---
  const [isMessagesModalOpen, setIsMessagesModalOpen] = useState(false);
  const [selectedRequestIdForMessages, setSelectedRequestIdForMessages] = useState("");

  // --- States חדשים עבור המיון ---
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);

  const location = useLocation();
  const externalFilters = location.state?.externalFilters || null;
  const autoSubmit = location.state?.autoSearch || false;

  // --- פונקציית עזר להמרת תאריך טיבקו לצורך מיון ---
  const parseTibcoDate = (dateStr: string): number => {
    if (!dateStr) return 0;

    // אם הפורמט מכיל T (למשל YYYY-MM-DDTHH:mm:ss)
    if (dateStr.includes('T')) {
      return new Date(dateStr).getTime();
    }

    // אם הפורמט הוא ישראלי/טיבקו קלאסי: DD/MM/YYYY HH:mm:ss
    const parts = dateStr.split(' ');
    if (parts[0] && parts[0].includes('/')) {
      const [day, month, year] = parts[0].split('/').map(Number);
      let hour = 0, minute = 0, second = 0;

      if (parts[1] && parts[1].includes(':')) {
        [hour, minute, second] = parts[1].split(':').map(Number);
      }
      return new Date(year, month - 1, day, hour, minute, second || 0).getTime();
    }

    return new Date(dateStr).getTime() || 0;
  };

  // --- לוגיקת ביצוע המיון בצד הלקוח ---
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });

    const sortedData = [...results].sort((a, b) => {
      let valA = a[key];
      let valB = b[key];

      // מיון ייחודי עבור זמן טיבקו
      if (key === 'lastUpdateDate') {
        return direction === 'asc'
          ? parseTibcoDate(valA) - parseTibcoDate(valB)
          : parseTibcoDate(valB) - parseTibcoDate(valA);
      }

      // מיון מספרים
      if (!isNaN(Number(valA)) && !isNaN(Number(valB))) {
        return direction === 'asc' ? Number(valA) - Number(valB) : Number(valB) - Number(valA);
      }

      // מיון מחרוזות וטקסטים
      valA = valA ? String(valA).toLowerCase() : '';
      valB = valB ? String(valB).toLowerCase() : '';

      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    setResults(sortedData);
  };

  // פונקציית עזר להצגת חץ מיון קטן ליד כותרת העמודה
  const renderSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return <span className="text-slate-300 mr-1 text-[8px]">⇅</span>;
    return sortConfig.direction === 'asc'
      ? <span className="text-blue-600 font-bold mr-1">▲</span>
      : <span className="text-blue-600 font-bold mr-1">▼</span>;
  };

  // --- לוגיקת חיפוש ---
  const handleSearch = async (filterValues: any) => {
    setIsLoading(true);
    setResults([]);
    setSelectedIds([]);
    setSortConfig(null); // איפוס המיון בכל חיפוש חדש
    setLastFilters(filterValues);
    try {
      const response = await searchProcesses(filterValues, currentNetworkId, token);
      const resData = response?.root?.getOut || response?.getOut || response;
      const notification = Array.isArray(resData?.notification?.msg)
        ? resData.notification.msg[0]
        : resData?.notification?.msg;

      if (notification?.code === "1000" || notification?.msgCode === "1000") {
        const data = resData?.data?.dataGrid?.row || resData?.data?.row || [];
        const finalData = Array.isArray(data) ? data : [data];
        setResults(finalData);
        setSearched(true);
        if (finalData.length > 0) {
          setIsFilterOpen(false); // סגירת הפילטרים כי יש תוצאות
        }
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
  // --- ייצוא לאקסל ---
  const handleExportExcel = () => {
    if (results.length === 0) return;

    // 1. מילון תרגום שדות מאנגלית לעברית עבור האקסל
    const filterLabels: Record<string, string> = {
      requestId: "מזהה בקשה",
      processId: "מספר תהליך",
      groupId: "מספר קבוצה",
      customerId: "מזהה לקוח",
      fromDateTime: "מתאריך",
      toDateTime: "עד תאריך",
      mobileAband: "מספר מוביל - ננטש",
      mobileRec: "מספר מוביל - קולט",
      filterByNum: "סינון לפי מספר",
      mobileStart: "תחילת טווח/מספר",
      mobileRecEnd: "סוף טווח",
      filterByOp: "מפעיל",
      filterByNet: "רשת",
      processType: "סוג תהליך",
      processStatus: "סטטוס",
      processStep: "שלב",
      customerProfile: "פרופיל לקוח"
    };

    // 2. פונקציית עזר לסידור ערכים (בעיקר תאריכים ותצוגות ספציפיות)
    const formatFilterValue = (key: string, value: any) => {
      // טיפול בתאריכים עם T
      if ((key === 'fromDateTime' || key === 'toDateTime') && typeof value === 'string' && value.includes('T')) {
        const [datePart, timePart] = value.split('T');
        const [year, month, day] = datePart.split('-');
        return `${day}/${month}/${year} ${timePart}`;
      }
      // טיפול בסוג הסינון הידני
      if (key === 'filterByNum') {
        if (value === 'RANGE') return 'לפי טווח מספרים';
        if (value === 'SINGLE') return 'לפי מספר';
      }
      return value;
    };

    const headers = [
      "מזהה בקשה", "מספר תהליך", "מספר/בדיד", "עד מספר", "סוג תהליך",
      "מצב תהליך", "שלב תהליך", "סיבת מעבר", "קוד שגיאה", "מפעיל קולט",
      "מפעיל ננטש", "מועד ניוד מבוקש", "תאריך יצירה", "עדכון אחרון",
      "מוביל קולט", "מוביל ננטש", "מספר מוחלף", "פרופיל לקוח",
      "מזהה לקוח", "מספר הזמנה", "מספר קבוצה", "הפצות חסרות", "הפצות שכשלו"
    ];

    const dataRows = results.map(row => [
      row.requestId, row.processId, row.phoneNumber, row.dnTo || '', row.processType,
      row.parentStatus, row.state, row.reasonCode, row.errorCode || '', row.recipientNetwork,
      row.donorNetwork, row.requestExecDate || '', row.createDate, row.lastUpdateDate,
      row.leadRec || '', row.leadAbd || '', row.replacedNum || '', row.customerProfile || '',
      row.customerId || '', row.orderId || '', row.groupId || '0', row.missDist || 0, row.failDist || 0
    ]);

    const title = [["ניהול תהליכים - דו\"ח ריכוז"]];
    const userInfo = [[`הופק על ידי: ${currentUser?.name || 'מערכת'}`, `בתאריך: ${new Date().toLocaleString('he-IL')}`]];

    const filterHeader = [["פילטרים שהוחלו:"]];

    // 3. יצירת רשימת הפילטרים לאקסל עם השמות והערכים המסודרים
    const activeFilters = lastFilters ? Object.entries(lastFilters)
      .filter(([_, v]) => v && v !== 'None' && v !== '')
      .map(([k, v]) => [`${filterLabels[k] || k}: ${formatFilterValue(k, v)}`])
      : [["ללא פילטרים"]];

    const ws = XLSX.utils.aoa_to_sheet([
      [],
      ...title,
      ...userInfo,
      [],
      ...filterHeader,
      ...activeFilters,
      [],
      headers,
      ...dataRows
    ]);

    ws['!dir'] = "rtl";

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "תהליכים");

    XLSX.writeFile(wb, `Processes_Report_${new Date().getTime()}.xlsx`);
    toast.success("קובץ אקסל הופק בהצלחה");
  };

  // --- פתיחת מודאל תפעול ---
  const handleProcessManipulation = async () => {
    if (selectedIds.length === 0) return;

    const processListForApi = results
      .filter(row => selectedIds.includes(String(row.requestId)))
      .map(row => ({
        processID: String(row.processId),
        requestID: String(row.requestId),
        processState: row.state
      }));

    setIsLoading(true);
    try {
      const response = await getProcessManipulation(processListForApi, currentNetworkId, token, roleId);
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
    if (actionId === 'SET_GROUP' && (!groupId || groupId.trim() === "")) {
      toast.error("יש למלא ערך בשדה מזהה קבוצת טיפול");
      return;
    }

    if (selectedIds.length === 0) {
      toast.error("לא נבחרו תהליכים לביצוע");
      return;
    }

    const confirmMessage = actionId === 'M0.1'
      ? "האם את/ה בטוח שברצונך לבטל (Terminate) את התהליכים הנבחרים?"
      : "אנא אשר/י ביצוע פעולה על התהליכים הנבחרים";

    if (!window.confirm(confirmMessage)) return;

    const processesForParams = results
      .filter(row => selectedIds.includes(String(row.requestId)))
      .map(row => ({
        processId: row.processId,
        requestId: row.requestId,
        processState: row.state
      }));

    let modeApi = "State";
    let targetStateApi = actionId;
    let republishListApi = "";

    if (actionId === 'M0.1') modeApi = "Terminate";
    if (actionId === 'SET_GROUP') modeApi = "ArbitraryID";

    if (actionId === 'REPUBLISH') {
      modeApi = "republish";
      targetStateApi = "";
      republishListApi = additionalData?.republishList || "";
    }

    setIsLoading(true);
    try {
      const response = await setProcesses({
        mode: modeApi,
        processes: processesForParams,
        targetState: actionId,
        groupId: groupId,
        selfNetworkId: currentNetworkId,
        roleId: roleId,
        token: token,
        userName: currentUser?.name,
        portingData: actionId === 'UPDATE_DATES' ? additionalData : null,
        republishList: republishListApi
      });

      const setOut = response?.setOut || response;

      setManipulationData((prev: any) => ({
        ...prev,
        notifications: setOut?.notifications,
        validationNotifications: setOut?.validationNotifications
      }));

      const allMsgs = [
        ...(setOut?.notifications?.item || []),
        ...(setOut?.validationNotifications?.item || [])
      ].filter(m => m.msgBody && m.msgBody !== "null");

      if (allMsgs.length > 0) {
        const hasSuccess = allMsgs.some((m: any) => m.msgCode === "1000" || m.msgCode === 1000);
        if (hasSuccess) {
          handleSearch(lastFilters);
        }
      }
    } catch (err) {
      toast.error("שגיאת תקשורת");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNewProcess = async (formData: any) => {
    const response = await setAddProcess(formData, currentUser.name, currentNetworkId, token, roleId);
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
          <button onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md">
            <Plus size={16} /> הוסף תהליך חדש
          </button>
        )}
      </div>

      <ProcessFilters
        onFilter={handleSearch}
        onReset={() => {
          setResults([]);
          setSearched(false);
          setIsFilterOpen(true);
        }}
        isOpen={isFilterOpen}
        setIsOpen={setIsFilterOpen}
        externalFilters={externalFilters}
        autoSubmit={autoSubmit}
      />

      {isLoading && (
        <div className="flex flex-col items-center justify-center p-16 bg-white rounded-xl border border-slate-200 shadow-sm mt-6">
          <Loader2 size={48} className="animate-spin text-blue-600 mb-4" />
          <h3 className="text-xl font-bold text-slate-700">מושך נתונים משרת TIBCO...</h3>
          <p className="text-slate-500 mt-2">אנא המתן, הפעולה עשויה לקחת מספר שניות</p>
        </div>
      )}



      {!isLoading && searched && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm mt-6 overflow-hidden">
          <div className="px-6 py-4 border-b bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-700">תוצאות ({results.length})</h3>
            <div className="flex gap-2">
              {isManageMode && (
                <button disabled={selectedIds.length === 0}
                  onClick={handleProcessManipulation}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold shadow-md transition-all
                    ${selectedIds.length > 0
                      ? 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
                      : 'bg-slate-100 text-slate-400 shadow-none cursor-not-allowed'
                    }
                  `}
                >
                  <Wrench size={14} /> טיפול בתהליכים ({selectedIds.length})
                </button>
              )}
              <button onClick={handleExportExcel}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-md text-xs font-bold">
                <FileDown size={14} />
                ייצוא לאקסל</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-700 border-b border-slate-300 whitespace-nowrap text-[10px]">
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

                  <th className="w-8 px-2 py-2 border-l border-slate-200"></th>

                  {/* עמודות עם אפשרות מיון מובנית וחיווי ויזואלי */}
                  <th
                    className="px-2 py-2 font-bold border-l border-slate-200 cursor-pointer hover:bg-slate-200 select-none"
                    onClick={() => handleSort('requestId')}
                  >
                    מזהה בקשה {renderSortIcon('requestId')}
                  </th>
                  <th
                    className="px-2 py-2 font-bold border-l border-slate-200 cursor-pointer hover:bg-slate-200 select-none"
                    onClick={() => handleSort('processId')}
                  >
                    מספר תהליך {renderSortIcon('processId')}
                  </th>
                  <th className="px-2 py-2 font-bold border-l border-slate-200">מספר/בדיד</th>
                  <th className="px-2 py-2 font-bold border-l border-slate-200">עד מספר</th>
                  <th
                    className="px-2 py-2 font-bold border-l border-slate-200 cursor-pointer hover:bg-slate-200 select-none"
                    onClick={() => handleSort('processType')}
                  >
                    סוג תהליך {renderSortIcon('processType')}
                  </th>
                  <th
                    className="px-2 py-2 font-bold border-l border-slate-200 cursor-pointer hover:bg-slate-200 select-none"
                    onClick={() => handleSort('parentStatus')}
                  >
                    מצב תהליך {renderSortIcon('parentStatus')}
                  </th>
                  <th
                    className="px-2 py-2 font-bold border-l border-slate-200 cursor-pointer hover:bg-slate-200 select-none"
                    onClick={() => handleSort('state')}
                  >
                    שלב תהליך {renderSortIcon('state')}
                  </th>
                  <th className="px-2 py-2 font-bold border-l border-slate-200">סיבת מעבר</th>
                  <th className="px-2 py-2 font-bold border-l border-slate-200">קוד שגיאה</th>
                  <th className="px-2 py-2 font-bold border-l border-slate-200">מפעיל קולט</th>
                  <th className="px-2 py-2 font-bold border-l border-slate-200">מפעיל ננטש</th>
                  <th className="px-2 py-2 font-bold border-l border-slate-200">מועד ניוד מבוקש</th>
                  <th className="px-2 py-2 font-bold border-l border-slate-200">תאריך יצירה</th>
                  <th
                    className="px-2 py-2 font-bold border-l border-slate-200 cursor-pointer hover:bg-slate-200 select-none"
                    onClick={() => handleSort('lastUpdateDate')}
                  >
                    עדכון אחרון {renderSortIcon('lastUpdateDate')}
                  </th>
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
                      {isManageMode && (
                        <td className="px-2 py-2 border-l border-slate-100 text-center" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(row.requestId)}
                            onChange={() => setSelectedIds(prev => prev.includes(row.requestId) ? prev.filter(id => id !== row.requestId) : [...prev, row.requestId])}
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
                        <td colSpan={isManageMode ? 25 : 24} className="bg-slate-100/50 p-4 border-b border-slate-300 shadow-inner">
                          <ProcessDetails
                            proc={row}
                            onShowMessages={(requestId) => {
                              setSelectedRequestIdForMessages(requestId);
                              setIsMessagesModalOpen(true);
                            }}
                          />
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
      <AddProcessModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddNewProcess}
      />
      <MessagesModal
        isOpen={isMessagesModalOpen}
        requestId={selectedRequestIdForMessages}
        onClose={() => setIsMessagesModalOpen(false)}
      />
    </div>
  );
}