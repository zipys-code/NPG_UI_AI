import React, { useState, useEffect, useMemo } from 'react';
import { apiRequest } from "@/services/api";
import { useApp } from "@/context/AppContext";
import { InterfacesGrid } from './InterfacesGrid';
import { InterfaceHistoryModal } from './InterfaceHistoryModal';
import { toast } from "sonner";
import { AlertCircle, CheckCircle, HistoryIcon, Power, X, ChevronUp, ChevronDown } from 'lucide-react';
import { SystemStateModal } from './SystemStateModal';

// --- קומפוננטת עזר לאחידות עיצובית בפילטרים ---
const FilterRow = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div className="flex items-center gap-3 h-7">
        <label className="text-[11px] font-medium text-slate-600 w-32 text-right shrink-0">{label}</label>
        <div className="w-[200px]">{children}</div>
    </div>
);

export default function InterfacesManager() {
    const { token, currentNetworkId, currentUser } = useApp();
    const [currentStatus, setCurrentStatus] = useState<any[]>([]);
    const [historyData, setHistoryData] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    // ניהול המודאל
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOp, setSelectedOp] = useState<{ id: number, name: string } | null>(null);
    const [systemMessage, setSystemMessage] = useState<{ msg: string, severity: string } | null>(null);

    // --- States של הפילטרים ---
    const [isFilterOpen, setIsFilterOpen] = useState(true);
    const [filters, setFilters] = useState({
        operatorName: '',
        interfaceStatus: ''
    });

    const loadCurrentStatus = async () => {
        try {
            const res = await apiRequest('/GetInterfaces', {
                getIn: { token, selfNetworkID: currentNetworkId, operatorID: "ALL" }
            });
            const data = res?.getOut?.Interfaces?.interface || [];
            setCurrentStatus(Array.isArray(data) ? data : [data]);
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
                setSystemMessage({ msg: errorMsg.msgBody, severity: 'ERROR' });
                return;
            }

            setIsSystemModalOpen(false);
            setSystemMessage({ msg: "הגדרות המערכת עודכנו בהצלחה", severity: 'SUCCESS' });

            await loadSystemStatus();
            await loadCurrentStatus();

            setTimeout(() => setSystemMessage(null), 5000);
        } catch (err: any) {
            setSystemMessage({ msg: "שגיאת תקשורת חמורה מול השרת", severity: 'ERROR' });
        } finally {
            setLoadingSystem(false);
        }
    };

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
    },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [currentNetworkId]);

    // --- לוגיקת הסינון בצד הלקוח (Client-side) ---

    // רשימת שמות המפעילים הייחודית עבור הפילטר
    const operatorNames = useMemo(() => {
        const names = currentStatus.map(op => op.operatorName).filter(Boolean);
        return Array.from(new Set(names)).sort();
    }, [currentStatus]);

    // סינון הנתונים
    // סינון הנתונים
    const filteredStatus = useMemo(() => {
        return currentStatus.filter(item => {
            // סינון לפי שם מפעיל
            const matchName = filters.operatorName === '' || item.operatorName === filters.operatorName;

            // סינון לפי סטטוס ממשק (מתורגם למספרים של טיבקו)
            let matchStatus = true;
            if (filters.interfaceStatus !== '') {
                const targetState = filters.interfaceStatus === 'ACTIVE' ? 1 : 0;

                // בודק אם מצב נכנס או מצב יוצא תואם לבחירה
                matchStatus = item.in_state === targetState || item.out_state === targetState;
            }

            return matchName && matchStatus;
        });
    }, [currentStatus, filters]);

    const inputClass = "w-[200px] border border-slate-300 rounded px-2 py-1 h-7 text-[11px] outline-none transition-all shadow-sm text-right bg-white text-slate-700 focus:border-blue-500";


    return (
        <div className="space-y-6 animate-in fade-in duration-500" dir="rtl">

            <div className="flex justify-between items-center mb-6 px-2">
                <div className="flex items-center gap-3">
                    <h2 className="text-xl font-bold text-slate-800">ממשקי מפעילים</h2>
                </div>

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

            {/* --- אזור הפילטרים --- */}
            <div className="w-full bg-white rounded-xl shadow-sm border border-slate-200 mb-4 overflow-hidden">
                <div className="flex items-center justify-start gap-2 p-2.5 px-4 cursor-pointer hover:bg-slate-50 bg-slate-50/30"
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                >
                    {isFilterOpen ? <ChevronUp size={14} className="text-blue-600" /> : <ChevronDown size={14} className="text-blue-600" />}
                    <span className="text-[12px] font-bold text-blue-700">סינון נוכחי</span>
                </div>
                {isFilterOpen && (
                    <div className="p-4">
                        <div className="grid grid-cols-2 gap-x-12 gap-y-2 w-fit">
                            <div className="space-y-2">
                                <FilterRow label="סינון לפי מפעיל">
                                    <select
                                        className={inputClass}
                                        value={filters.operatorName}
                                        onChange={(e) => setFilters(prev => ({ ...prev, operatorName: e.target.value }))}
                                    >
                                        <option value="">-ללא-</option>
                                        {operatorNames.map((name: any) => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                    </select>
                                </FilterRow>
                            </div>
                            <div className="space-y-2">
                                <FilterRow label="סינון לפי מצב ממשק">
                                    <select
                                        className={inputClass}
                                        value={filters.interfaceStatus}
                                        onChange={(e) => setFilters(prev => ({ ...prev, interfaceStatus: e.target.value }))}
                                    >
                                        <option value="">-ללא-</option>
                                        <option value="ACTIVE">ACTIVE</option>
                                        <option value="DOWN">DOWN</option>
                                    </select>
                                </FilterRow>
                            </div>
                        </div>
                        <div className="flex justify-start gap-2 mt-6 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setFilters({ operatorName: '', interfaceStatus: '' })}
                                className="border border-slate-300 bg-slate-50 text-slate-600 px-6 py-1.5 rounded text-xs font-bold hover:bg-slate-100 transition-all shadow-sm"
                            >
                                איפוס
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <section>
                {/* שולחים את הרשימה המסוננת במקום המקורית */}
                <InterfacesGrid
                    data={filteredStatus}
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
                    setSystemMessage(null);
                }}
                currentStatus={systemStatus}
                onConfirm={handleUpdateSystemState}
                loading={loadingSystem}
                serverError={systemMessage?.severity === 'ERROR' ? systemMessage.msg : null}
            />

        </div>
    );
}