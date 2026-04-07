import React, { useState } from "react";
import { Plus, List, Loader2, FileDown, Wrench } from "lucide-react";
import { ProcessFilters } from "@/components/ProcessFilters";
import { searchProcesses, getProcessManipulation, setProcesses } from "@/services/api";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import { ProcessDetails } from "@/components/ProcessDetails";
import { ProcessActionModal } from "@/components/ProcessActionModal";
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

  // --- States למודאל התפעול ---
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [manipulationData, setManipulationData] = useState<any>(null);

  // --- לוגיקת חיפוש ---
  const handleSearch = async (filterValues: any) => {
    setIsLoading(true);
    setResults([]);
    setSelectedIds([]);
    setLastFilters(filterValues);
    try {
      const response = await searchProcesses(filterValues, currentNetworkId || "320");

      // חילוץ לפי המבנה הנקי (ללא .root)
      const notification = response?.notification;

      if (notification?.msgCode === 1000 || notification?.msgCode === "1000") {
        const data = response?.data?.row || [];
        const finalData = Array.isArray(data) ? data : [data];
        setResults(finalData);
        setSearched(true);
      } else {
        toast.error(`${notification?.msgBody || "שגיאה בחיפוש"} (${notification?.msgCode || ''})`);
      }
    } catch (err) {
      console.error("Search Error:", err);
      toast.error("שגיאת תקשורת בביצוע החיפוש");
    } finally {
      setIsLoading(false);
    }
  };

  // --- פתיחת מודאל תפעול (Get Manipulation Data) ---
  const handleProcessManipulation = async () => {
    if (selectedIds.length === 0) return;

    // הכנת רשימת ה-processId (המספריים) מתוך השורות שנבחרו
    const processIdsToSend = results
      .filter(row => selectedIds.includes(row.requestId))
      .map(row => row.processId);

    setIsLoading(true);
    try {
      const response = await getProcessManipulation(processIdsToSend, currentNetworkId);
      const notification = response?.notification;

      if (Number(notification?.msgCode) === 1000) {
        setManipulationData(response.data);
        setIsActionModalOpen(true);
      } else {
        toast.error(notification?.msgBody || "שגיאה בטעינת נתוני תפעול");
      }
    } catch (err) {
      toast.error("שגיאת תקשורת בטעינת נתוני תפעול");
    } finally {
      setIsLoading(false);
    }
  };

  // --- ביצוע פעולת תפעול (Set Processes) ---
  const handleActionExecute = async (actionId: string, groupId?: string, additionalData?: any) => {
    // ולידציה בסיסית
    if (actionId === 'SET_GROUP' && (!groupId || groupId.trim() === "")) {
      toast.error("יש למלא ערך בשדה מזהה קבוצת טיפול");
      return;
    }

    // אישור משתמש
    const confirmMsg = actionId === 'M0.1'
      ? "האם את/ה בטוח שברצונך לבטל (Terminate) את התהליכים הנבחרים?"
      : "אנא אשר/י ביצוע פעולה";

    if (!window.confirm(confirmMsg)) return;

    const processIdsToSend = results
      .filter(row => selectedIds.includes(row.requestId))
      .map(row => row.processId);

    let modeApi = "State";
    if (actionId === 'M0.1') modeApi = "Terminate";
    if (actionId === 'SET_GROUP') modeApi = "ArbitraryID";
    if (actionId === 'UPDATE_DATES') modeApi = "Date";
    if (actionId === 'CANCEL_PORTING') modeApi = "Cancel";

    setIsLoading(true);
    try {
      const response = await setProcesses({
        mode: modeApi,
        processIds: processIdsToSend,
        targetState: actionId,
        groupId: groupId,
        selfNetworkId: currentNetworkId || "320",
        roleId: currentUser?.roleId || "NPG_ADMINISTRATOR",
        userName: currentUser?.name || "System",
        portingData: additionalData
      });

      const allMsgs = [
        ...(response?.notifications?.item || []),
        ...(response?.validationNotifications?.item || [])
      ];

      if (allMsgs.length > 0) {
        allMsgs.forEach((m: any) => {
          const display = m.processID ? `תהליך ${m.processID}: ${m.msgBody}` : m.msgBody;
          if (m.msgCode === 1000 || m.msgCode === "1000") toast.success(display);
          else toast.error(display);
        });

        // רענון אם הצליח
        if (allMsgs.some(m => m.msgCode === 1000 || m.msgCode === "1000")) {
          setIsActionModalOpen(false);
          setSelectedIds([]);
          handleSearch(lastFilters);
        }
      }
    } catch (err) {
      toast.error("שגיאת תקשורת בביצוע הפעולה");
    } finally {
      setIsLoading(false);
    }
  };

  // --- עזרים: בחירה, רענון, אקסל ---
  const handleReset = () => {
    setResults([]);
    setSearched(false);
    setSelectedIds([]);
  };

  const handleSelectRow = (requestId: string) => {
    setSelectedIds(prev =>
      prev.includes(requestId) ? prev.filter(id => id !== requestId) : [...prev, requestId]
    );
  };

  return (
    <div className="flex-1 p-6 overflow-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <List size={20} className="text-slate-400" />
          <h2 className="text-xl font-bold text-slate-800">ניהול תהליכים</h2>
        </div>
      </div>

      <ProcessFilters onFilter={handleSearch} onReset={handleReset} />

      {isLoading && !isActionModalOpen && (
        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-blue-600" /></div>
      )}

      {searched && !isLoading && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-6">
          <div className="px-6 py-4 border-b bg-slate-50/50 flex justify-between items-center">
            <h3 className="text-sm font-bold text-slate-700">תוצאות ({results.length})</h3>
            <div className="flex gap-2">
              {isManageMode && (
                <button
                  disabled={selectedIds.length === 0}
                  onClick={handleProcessManipulation}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all shadow-sm
                                        ${selectedIds.length > 0 ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-slate-200 text-slate-400'}`}
                >
                  <Wrench size={14} />
                  טיפול בתהליכים ({selectedIds.length})
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-100 text-[10px] uppercase font-bold text-slate-600">
                <tr>
                  <th className="p-3 text-center w-10">בחר</th>
                  <th className="p-3">מזהה בקשה</th>
                  <th className="p-3">מספר תהליך</th>
                  <th className="p-3">סטטוס</th>
                  {/* ... שאר העמודות שלך ... */}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {results.map((row) => (
                  <tr key={row.requestId} className="hover:bg-blue-50/50 transition-colors">
                    <td className="p-3 text-center">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(row.requestId)}
                        onChange={() => handleSelectRow(row.requestId)}
                      />
                    </td>
                    <td className="p-3 font-medium text-blue-700">{row.requestId}</td>
                    <td className="p-3">{row.processId}</td>
                    <td className="p-3">{row.parentStatus}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* מודאל תפעול */}
      <ProcessActionModal
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        data={manipulationData}
        onActionExecute={handleActionExecute}
      />
    </div>
  );
}