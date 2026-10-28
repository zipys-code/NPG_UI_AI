import React, { useState, useEffect } from 'react';
import { Clock, History, Plus, RefreshCw, Settings, Play, Trash2, Search, ArrowLeft, List } from 'lucide-react';
import { apiRequest } from "@/services/api";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import { SchedulerGrid } from './SchedulerGrid';
import { HistoryGrid } from './HistoryGrid';
import { HistoryFilters } from './HistoryFilters';
import { AddEditTaskModal } from './components/AddEditTaskModal';

export default function HousekeepingScheduler() {
    const { currentNetworkId, token, currentUser } = useApp();
    const [activeTab, setActiveTab] = useState<'tasks' | 'history'>('tasks');
    const [tasks, setTasks] = useState([]);
    const [historyData, setHistoryData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedTaskId, setSelectedTaskId] = useState("ALL");
    const [actionTypes, setActionTypes] = useState([]);
    const [historyCount, setHistoryCount] = useState(0);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
    const [selectedTask, setSelectedTask] = useState<any>(null);
    const [fullActionData, setFullActionData] = useState<any[]>([]);

    // טעינת משימות ראשונית
    const loadTasks = async () => {
        setLoading(true);
        try {
            const payload = {
                getIn: {
                    selfNetworkID: currentNetworkId,
                    token: token,
                    taskID: "ALL", // לפי הקוד הישן כדי להביא את כל המשימות
                    user: currentUser.name,
                }
            };
            // הסרת Maint/ מהנתיב כפי שביקשת
            const response = await apiRequest('/GetHousekeepingScheduler', payload);
            console.log("GetHousekeepingScheduler Server Response:", response);

            const list = response?.getOut?.data?.tasksDefinition?.row || [];
            setTasks(Array.isArray(list) ? list : [list]);
            const rawTypes = response?.getOut?.data?.actionTypeList?.['value.options']?.item || [];

            const normalizedTypes = Array.isArray(rawTypes) ? rawTypes : [rawTypes];
            const finalTypes = normalizedTypes.filter((t: any) => t && t.value !== 'select');
            setActionTypes(finalTypes);
            console.log("Success! Action Types loaded:", finalTypes);

            //  למודל ההוספה/עריכה          
            const data = response?.getOut?.data;
            const rawActions = data.actionTypeList?.["value.options"]?.item || [];
            const normalizedActions = Array.isArray(rawActions) ? rawActions : [rawActions];

            const rawParams = data.actionTypeParams?.row || [];
            const allParams = Array.isArray(rawParams) ? rawParams : [rawParams];
            const mappedActions = normalizedActions.map(action => {
                const typeID = action.value; // ה-ID של הפעולה מה-Select

                // מסננים מהמילון רק את הפרמטרים ששייכים ל-ID הזה
                const relevantParams = allParams.filter(p => p.actionTypeID === typeID);

                return {
                    ...action,
                    actionTypeID: typeID,
                    actionTypeDesc: action.label,
                    // עוטפים בפורמט שהמודאל מצפה לו: actionParams.row
                    actionParams: { row: relevantParams }
                };
            });

            console.log("Mapped Actions for Modal:", mappedActions);
            setFullActionData(mappedActions);

        } catch (err) {
            toast.error("שגיאה בטעינת המשימות מהשרת");
        } finally {
            setLoading(false);
        }
    };

    const handleEditTask = (task: any) => {
        console.log("Opening edit for task:", task);
        setSelectedTask(task);
        setModalMode('edit');
        setIsModalOpen(true);
    };

    const formatDateForServer = (dateStr: string) => {
        if (!dateStr) return "";
        const [year, month, day] = dateStr.split('-');
        return `${day}/${month}/${year}`;
    };

    useEffect(() => { loadTasks(); },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []);

    useEffect(() => {
        // בכל פעם שעוברים לטאב היסטוריה
        if (activeTab === 'history') {

            // מקרה א': הגענו ממשימה ספציפית (selectedTaskId הוא ID מספרי)
            if (selectedTaskId !== "ALL" && selectedTaskId !== "-1") {
                const lastWeek = new Date();
                lastWeek.setDate(lastWeek.getDate() - 7);

                const taskData = tasks.find(t => t.taskID === selectedTaskId);

                const autoFilters = {
                    dateFrom: lastWeek.toISOString().split('T')[0],
                    dateTo: new Date().toISOString().split('T')[0],
                    timeFrom: "00:00",
                    timeTo: "23:59",
                    byActionType: taskData?.actionTypeId || "0",
                    byActionMode: "0"
                };
                // קריאה ישירה עם ה-ID של המשימה
                loadHistory(autoFilters, selectedTaskId);
            }

            // מקרה ב': הגענו מהטאב ידנית (selectedTaskId היה "ALL")
            else if (selectedTaskId === "ALL") {
                setSelectedTaskId("-1"); // מעדכנים ל-1- כדי שהחיפוש הבא יהיה כללי
                setHistoryData([]);     // מנקים תוצאות ישנות
            }
        }
    },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [activeTab]); // רץ רק במעבר טאב

    // מעבר להיסטוריה עבור משימה ספציפית (מה שהיה האייקון של המשקפת)
    const viewTaskHistory = (taskId: string) => {
        setSelectedTaskId(taskId);
        setActiveTab('history');
    };

    const loadHistory = async (filterParams: any, taskIdOverride?: string) => {
        setLoading(true);
        try {
            const tid = taskIdOverride || selectedTaskId;

            // פונקציית עזר להמרת yyyy-mm-dd ל-dd/mm/yyyy
            const toServerDate = (dateStr: string) => {
                if (!dateStr) return "";
                const [y, m, d] = dateStr.split('-');
                return `${d}/${m}/${y}`;
            };

            const payload = {
                getIn: {
                    selfNetworkID: currentNetworkId,
                    token: token,
                    byActionType: filterParams.byActionType,
                    byActionMode: filterParams.byActionMode,
                    user: currentUser.name,
                    taskID: tid,
                    // עטיפה מדויקת לפי הסכימה ששלחת 
                    byDateTime: {
                        actionStartDate: toServerDate(filterParams.dateFrom),
                        actionStartTime: filterParams.timeFrom,
                        actionEndDate: toServerDate(filterParams.dateTo),
                        actionEndTime: filterParams.timeTo
                    }
                }
            };

            const response = await apiRequest('/GetHousekeepingScheduler', payload);

            // טיפול בהודעת שגיאה מהשרת (כמו שראינו בצילום הקודם)
            const notification = response?.getOut?.notification?.msg?.[0] || response?.getOut?.notification?.msg;

            if (notification && notification.msgCode !== '1000') {

                const errorMessage = notification.msgBody || `שגיאה ${notification.msgCode}`;
                toast.error(errorMessage);
                console.error(`Server Error [${notification.msgCode}]:`, errorMessage);
                setHistoryData([]);
                setLoading(false);
                return;
            }
            if (notification.msgCode === '1000') {
                toast.success(notification.msgBody || "החיפוש הסתיים בהצלחה");
            }

            const history = response?.getOut?.data?.TaskActivities?.row || [];
            const historyArray = Array.isArray(history) ? history : [history];

            setHistoryData(historyArray);
            setHistoryCount(historyArray.length);


        } catch (err) {
            console.error("API Error:", err);
            setHistoryData([]);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (taskId: string, type: 'DELETE' | 'ACTIVATE') => {
        if (type === 'DELETE') {
            // שלב אישור (Confirm)
            const confirmed = window.confirm("האם את בטוחה שברצונך למחוק את המשימה?");
            if (!confirmed) return;

            setLoading(true);
            try {
                const payload = {
                    setIn: {
                        token: token,
                        user: currentUser.name,
                        data: {
                            mode: "DELETE",
                            taskID: taskId,
                            actionParamList: {},
                            taskDateTime: {},
                            repeatTime: {}
                        },
                        selfNetworkID: currentNetworkId
                    }
                };

                const response = await apiRequest('/SetHousekeepingScheduler', payload);

                // בדיקת קוד הצלחה 1000
                const notification = response?.setOut?.notification?.msg?.[0];
                if (notification && notification.msgCode === '1000') {
                    toast.success(notification.msgBody || "המשימה נמחקה בהצלחה");
                    loadTasks(); // רענון הטבלה
                } else {
                    toast.error(notification?.msgBody || "שגיאה במחיקת המשימה");
                }
            } catch (err) {
                toast.error("תקלה בתקשורת עם השרת");
            } finally {
                setLoading(false);
            }
        } else if (type === 'ACTIVATE') {
            const confirmed = window.confirm("האם להריץ את המשימה באופן מיידי?");
            if (!confirmed) return;

            setLoading(true);
            try {
                const taskToActivate = tasks.find(t => t.taskID === taskId);

                const payload = {
                    setIn: {
                        token: token,
                        user: currentUser.name,
                        selfNetworkID: currentNetworkId,
                        data: {
                            mode: "ACTIVATE",
                            taskID: taskId,
                            // ב-Activate שולחים את הפרמטרים הקיימים של המשימה
                            taskDesc: taskToActivate?.taskDesc || "",
                            actionParamList: {
                                actionTypeID: taskToActivate?.actionTypeId || ""
                                // כאן אפשר להוסיף את ה-row אם השרת דורש זאת בהפעלה
                            }
                        }
                    }
                };

                const response = await apiRequest('/SetHousekeepingScheduler', payload);
                const notification = response?.setOut?.notification?.msg?.[0];

                if (notification?.msgCode === '1000') {
                    toast.success("המשימה הופעלה בהצלחה");
                    loadTasks(); // רענון כדי לראות סטטוס חדש במידת הצורך
                } else {
                    toast.error(notification?.msgBody || "שגיאה בהפעלת המשימה");
                }
            } catch (err) {
                toast.error("תקלה בתקשורת עם השרת");
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="p-6 bg-slate-50 min-h-screen rtl" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    {/* אייקון נקי בצבע תכלת המערכת */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="lucide lucide-clock text-[#4B9CD3]"
                    >
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>

                    {/* כותרת ב-bold רגיל ללא כיווץ אותיות */}
                    <h1 className="text-2xl font-bold text-slate-800">תזמון משימות תחזוקה</h1>
                </div>

                <div className="flex gap-2">
                    {/* כפתור רענון עדין */}
                    <button
                        onClick={loadTasks}
                        className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-all">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-refresh-cw">
                            <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                            <path d="M21 3v5h-5"></path>
                            <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                            <path d="M8 16H3v5"></path>
                        </svg>
                    </button>

                    {/* כפתור הוספה כחול סטנדרטי */}
                    <button
                        onClick={() => {
                            setModalMode('add');
                            setSelectedTask(null);
                            setIsModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 transition-all active:scale-95">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus">
                            <path d="M5 12h14"></path>
                            <path d="M12 5v14"></path>
                        </svg>
                        <span>הוסף משימה חדשה</span>
                    </button>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex border-b border-slate-200 mb-6">
                <button
                    onClick={() => setActiveTab('tasks')}
                    className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${activeTab === 'tasks' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <div className="flex items-center gap-2">
                        <Settings size={18} /> משימות קיימות
                    </div>
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-6 py-3 font-bold text-sm transition-all border-b-2 ${activeTab === 'history' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                >
                    <div className="flex items-center gap-2">
                        <History size={18} /> היסטוריית ריצות
                    </div>
                </button>
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                {activeTab === 'tasks' ? (
                    <SchedulerGrid
                        data={tasks}
                        loading={loading}
                        onViewHistory={viewTaskHistory}
                        onRefresh={loadTasks}
                        onEdit={handleEditTask}
                        onAction={handleAction}
                    />
                ) : (
                    <div className="p-4">
                        <HistoryFilters
                            initialTaskId={selectedTaskId}
                            onSearch={loadHistory}
                            actionTypeList={actionTypes}
                        />
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                            <div className="text-slate-400">
                                <List size={18} />
                            </div>
                            <h3 className="text-sm font-bold text-slate-700">
                                רשימת פעולות ({historyCount})
                            </h3>
                        </div>
                        <HistoryGrid data={historyData}
                            loading={loading} />

                    </div>
                )}
                <AddEditTaskModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={loadTasks}
                    mode={modalMode}
                    initialData={selectedTask}
                    actionTypes={fullActionData}
                />
            </div>
        </div>
    );
}