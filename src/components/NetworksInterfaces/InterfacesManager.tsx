import React, { useState, useEffect } from 'react';
import { apiRequest } from "@/services/api";
import { useApp } from "@/context/AppContext";
import { InterfacesGrid } from './InterfacesGrid';
import { InterfaceHistoryModal } from './InterfaceHistoryModal';
import { toast } from "sonner";
import { AlertCircle, CheckCircle, HistoryIcon, Power, X } from 'lucide-react';
import { SystemStateModal } from './SystemStateModal';

export default function InterfacesManager() {
    const { token, currentNetworkId, currentUser } = useApp();
    const [currentStatus, setCurrentStatus] = useState([]);
    const [historyData, setHistoryData] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // ניהול המודאל
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOp, setSelectedOp] = useState<{ id: number, name: string } | null>(null);
    const [systemMessage, setSystemMessage] = useState<{ msg: string, severity: string } | null>(null);

    const loadCurrentStatus = async () => {
        try {
            const res = await apiRequest('/GetInterfaces', {
                getIn: { token, selfNetworkID: currentNetworkId, operatorID: "ALL" }
            });
            setCurrentStatus(res?.getOut?.Interfaces?.interface || []);
        } catch (err) { console.error(err); }
    };

    const handleSearchHistory = async (operatorId: number, filters?: any) => {
        setLoadingHistory(true);
        // אם זו קריאה ראשונה מהגריד, נפתח את המודאל ונשמור את ה-Operator
        if (!isModalOpen) {
            const op = currentStatus.find((item: any) => item.operatorId === operatorId);
            setSelectedOp({ id: operatorId, name: op?.operatorName || '' });
            setIsModalOpen(true);
        }

        try {
            const res = await apiRequest('/GetNetworkInterfacesState', {
                getIn: {
                    token,
                    selfNetworkID: currentNetworkId,
                    selectedOperator: operatorId,
                    fromDate: filters?.fromDate || getDefaultFromDate(),
                    toDate: filters?.toDate || getDefaultToDate(),
                    interface_direction: filters?.interface_direction || ""
                }
            });
            const rawList = res?.getOut?.Interfaces?.InterfacesStates?.interfaceState || [];
            setHistoryData(Array.isArray(rawList) ? rawList : [rawList]);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingHistory(false);
        }
    };

    const [systemStatus, setSystemStatus] = useState<boolean>(true); // true = up
    const [isSystemModalOpen, setIsSystemModalOpen] = useState(false);
    const [loadingSystem, setLoadingSystem] = useState(false);

    // פונקציית טעינת סטטוס מערכת
    const loadSystemStatus = async () => {
        try {
            const res = await apiRequest('/GetNPGSystemState', {
                getIn: { token, selfNetworkID: currentNetworkId }
            });
            // נניח ש-true זה Up ו-false זה Down
            setSystemStatus(res?.getOut?.systemState ?? true);
        } catch (err) { console.error(err); }
    };

    // פונקציית עדכון סטטוס מערכת
    const handleUpdateSystemState = async (data: any) => {
        setLoadingSystem(true);
        setSystemMessage(null);

        try {
            const res = await apiRequest('/SetNPGSystemState', {
                setIn: {
                    user: currentUser?.name,
                    token,
                    selfNetworkID: currentNetworkId,
                    setData: {
                        systemUp_Down: {
                            systemState: data.systemState,
                            dateFrom: data.dateFrom,
                            timeFrom: data.timeFrom,
                            description: data.description
                        }
                    }
                }
            });

            const notifications = [
                ...(res?.setOut?.sysNotification?.msg || []),
                ...(res?.setOut?.notification?.msg || [])
            ];

            const errorMsg = notifications.find(m => m.code !== '1000');

            if (errorMsg) {
                // שומרים את השגיאה בסטייט - המודאל יציג אותה כי הוא עדיין פתוח
                setSystemMessage({ msg: errorMsg.msgBody, severity: 'ERROR' });
                return;
            }

            // --- הצלחה ---
            setIsSystemModalOpen(false); // סגירת המודאל רק עכשיו
            setSystemMessage({ msg: "הגדרות המערכת עודכנו בהצלחה", severity: 'SUCCESS' });

            await loadSystemStatus();
            await loadCurrentStatus();

            // העלמת הודעת ההצלחה אחרי 5 שניות
            setTimeout(() => setSystemMessage(null), 5000);
        } catch (err: any) {
            setSystemMessage({ msg: "שגיאת תקשורת חמורה מול השרת", severity: 'ERROR' });
        } finally {
            setLoadingSystem(false);
        }
    };

    // פונקציות עזר לתאריכי דיפולט (היום מחצות עד חצות)
    const getDefaultFromDate = () => {
        const d = new Date();
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} 00:00:00`;
    };
    const getDefaultToDate = () => {
        const d = new Date();
        return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()} 23:59:59`;
    };

    useEffect(() => {
        loadCurrentStatus();
        loadSystemStatus();
    }, [currentNetworkId]);

    return (
        <div className="space-y-6">
            {/* --- התוספת החדשה: שורת כותרת עם כפתור ניהול מערכת --- */}
            <div className="flex justify-between items-center mb-6 px-2">
                <div className="flex items-center gap-3">
                    {/* <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-blue-200 shadow-lg">
                        <HistoryIcon size={22} />
                    </div> */}
                    <h2 className="text-xl font-bold text-slate-800">ממשקי מפעילים</h2>
                </div>

                {/* כפתור דינמי שמשתנה לפי הסטטוס שחזר מ-GetNPGSystemState */}
                <button
                    onClick={() => setIsSystemModalOpen(true)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all shadow-md active:scale-95 ${systemStatus
                        ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                        : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
                        }`}
                >
                    <Power size={18} />
                    {systemStatus ? 'הורדת מערכת' : 'העלאת מערכת'}
                </button>
            </div>

            {systemMessage && !isSystemModalOpen && (
                <div className={`p-4 rounded-xl mb-4 flex items-center justify-between ${systemMessage.severity === 'ERROR' ? 'bg-red-50 border-red-200 text-red-800' : 'bg-green-50 border-green-200 text-green-800'
                    }`}>
                    <span className="font-bold">{systemMessage.msg}</span>
                    <button onClick={() => setSystemMessage(null)}><X size={18} /></button>
                </div>
            )}
            <section>
                <InterfacesGrid
                    data={currentStatus}
                    onRefresh={loadCurrentStatus}
                    onSearchHistory={handleSearchHistory}
                />
            </section>

            <InterfaceHistoryModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                operatorName={selectedOp?.name || ''}
                data={historyData}
                loading={loadingHistory}
                onSearch={(filters) => handleSearchHistory(selectedOp!.id, filters)}
            />

            <SystemStateModal
                isOpen={isSystemModalOpen}
                onClose={() => {
                    setIsSystemModalOpen(false);
                    setSystemMessage(null); // מאפסים הודעות כשסוגרים
                }}
                currentStatus={systemStatus}
                onConfirm={handleUpdateSystemState}
                loading={loadingSystem}
                serverError={systemMessage?.severity === 'ERROR' ? systemMessage.msg : null} // העברת השגיאה
            />

        </div>
    );
}