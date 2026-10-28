import React, { useState, useEffect, useMemo } from 'react';
import { apiRequest } from "@/services/api";
import { useApp } from "@/context/AppContext";
import { Plus, RefreshCcw, ChevronUp, ChevronDown } from 'lucide-react';
import { BusinessNetworksTable } from './BusinessNetworksTable';
import { SetOperatorModal } from './SetOperatorModal';
import { NetworkEditModal } from './NetworkEditModal';
import { toast } from "sonner";

// --- קומפוננטת FilterRow לשמירה על אחידות עיצובית ---
const FilterRow = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div className="flex items-center gap-3 h-7">
        <label className="text-[11px] font-medium text-slate-600 w-32 text-right shrink-0">{label}</label>
        <div className="w-[200px]">{children}</div>
    </div>
);

export const NetworksManager = () => {
    const { token, currentNetworkId, currentUser } = useApp();
    const [loading, setLoading] = useState(true);
    const [businessData, setBusinessData] = useState<any[]>([]);
    const [networksData, setNetworksData] = useState<any[]>([]);
    const [systemMessage, setSystemMessage] = useState<{ msg: string, severity: string } | null>(null);

    // --- States של הפילטרים ---
    const [isFilterOpen, setIsFilterOpen] = useState(true);
    const [filters, setFilters] = useState({
        operatorName: '',
        networkStatus: '' // <--- עודכן למצב רשת
    });

    // סטייט למודאל מפעיל
    const [isOpModalOpen, setIsOpModalOpen] = useState(false);
    const [selectedOperator, setSelectedOperator] = useState<any>(null);
    const [opLoading, setOpLoading] = useState(false);
    const [opServerError, setOpServerError] = useState<string | null>(null);

    // סטייט למודאל רשת (Network)
    const [isNetModalOpen, setIsNetModalOpen] = useState(false);
    const [selectedNet, setSelectedNet] = useState(null);
    const [targetOperator, setTargetOperator] = useState(null);
    const [netLoading, setNetLoading] = useState(false);
    const [netServerError, setNetServerError] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            const res = await apiRequest('/GetOperatorRegistry', {
                getIn: { token, selfNetworkID: currentNetworkId, BusinessId: "" }
            });
            const dataGrid = res?.getOut?.dataGrid;
            const bizRows = dataGrid?.BusinessGrid?.BusinessRow || [];
            const netRows = dataGrid?.NetworkGrid?.NetworkRow || [];
            setBusinessData(Array.isArray(bizRows) ? bizRows : [bizRows]);
            setNetworksData(Array.isArray(netRows) ? netRows : [netRows]);
        } catch (err) {
            setSystemMessage({ msg: "שגיאה בטעינת נתונים", severity: 'ERROR' });
        } finally { setLoading(false); }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => { loadData(); }, [currentNetworkId]);


    // --- לוגיקת הסינון החכמה (Client-side) ---

    // 1. קודם מסננים את הרשתות לפי הסטטוס (חסין למבנה של טיבקו)
    const filteredNetworksData = useMemo(() => {
        return networksData.filter(net => {
            if (filters.networkStatus === '') return true;

            // התיקון כאן: שינוי ל-Enabled בהתאם למבנה שחוזר מהשרת
            const val = net.Enabled?.["$"] ?? net.Enabled ?? "";
            const normalizedVal = String(val).toUpperCase();

            if (filters.networkStatus === 'Y') return normalizedVal === 'Y' || normalizedVal === 'TRUE' || normalizedVal === '1';
            if (filters.networkStatus === 'N') return normalizedVal === 'N' || normalizedVal === 'FALSE' || normalizedVal === '0';

            return true;
        });
    }, [networksData, filters.networkStatus]);

    // 2. עכשיו מסננים את המפעילים
    const filteredBusinessData = useMemo(() => {
        return businessData.filter(biz => {
            // חילוץ בטוח של שם המפעיל
            const bizName = biz.BusinessName?.["$"] || biz.BusinessName;
            const matchName = filters.operatorName === '' || bizName === filters.operatorName;

            // אם סונן סטטוס רשת, נציג רק מפעילים שיש להם לפחות רשת אחת שעונה לסינון!
            let matchNetStatus = true;
            if (filters.networkStatus !== '') {
                const bizId = biz.BusinessId?.["$"] || biz.BusinessId;
                matchNetStatus = filteredNetworksData.some(net => {
                    const netBizId = net.NetworkBusinessId?.["$"] || net.NetworkBusinessId;
                    return netBizId === bizId;
                });
            }

            return matchName && matchNetStatus;
        });
    }, [businessData, filteredNetworksData, filters.operatorName, filters.networkStatus]);


    // פונקציית שליחה למפעיל
    const handleSetOperator = async (formData: any) => {
        setOpLoading(true); setOpServerError(null);
        try {
            const res = await apiRequest('/SetOperatorRegistryBusiness', {
                setIn: { ...formData, token, selfNetworkID: currentNetworkId, user: currentUser?.name }
            });
            const msg = res?.setOut?.notification?.msg || [];
            const error = msg.find((m: any) => m.code !== '1000');
            if (error) { setOpServerError(error.msgBody); return; }
            toast.success("המפעיל עודכן בהצלחה");
            setIsOpModalOpen(false); loadData();
        } catch (err) { setOpServerError("שגיאת תקשורת"); } finally { setOpLoading(false); }
    };

    // לוגיקת שמירת רשת
    const handleSetNetwork = async (formData: any) => {
        setNetLoading(true); setNetServerError(null);
        try {
            const res = await apiRequest('/SetOperatorRegistryNetwork', {
                setIn: {
                    token,
                    selfNetworkID: currentNetworkId,
                    user: currentUser?.name,
                    NetworkIdentifier: formData.NetworkIdentifier,
                    NetworkId: formData.NetworkId,
                    NetworkName: formData.NetworkName,
                    NetworkType: formData.NetworkType,
                    NetworkSelfIdentity: formData.NetworkSelfIdentity,
                    NetworkBusinessId: formData.NetworkBusinessId,
                    RangeUnit: formData.RangeUnit,
                    KosherFlag: formData.KosherFlag,
                    AliasNetworkLRN: formData.AliasNetworkLRN,
                    AliasNetworkId: formData.AliasNetworkId,
                    NetworkEnabled: formData.NetworkEnabled,
                    SystemOutgoingURL: formData.SystemOutgoingURL,
                    SystemDesc: formData.SystemDesc,
                    mode: formData.mode
                }
            });

            const msg = res?.setOut?.notification?.msg || [];
            const error = msg.find((m: any) => m.code !== '1000');

            if (error) {
                setNetServerError(error.msgBody);
                return;
            }

            toast.success(formData.mode === 'Add' ? "רשת נוספה בהצלחה" : "נתוני רשת עודכנו");
            setIsNetModalOpen(false);
            loadData();
        } catch (err) {
            setNetServerError("שגיאת תקשורת מול השרת");
        } finally {
            setNetLoading(false);
        }
    };

    const handleAddNetwork = (op: any) => { setTargetOperator(op); setSelectedNet(null); setIsNetModalOpen(true); setNetServerError(null); };
    const handleEditNetwork = (net: any, op: any) => { setTargetOperator(op); setSelectedNet(net); setIsNetModalOpen(true); setNetServerError(null); };

    // רשימת שמות המפעילים הייחודית עבור הפילטר
    const operatorNames = useMemo(() => {
        const names = businessData.map(b => b.BusinessName?.["$"] || b.BusinessName).filter(Boolean);
        return Array.from(new Set(names)).sort();
    }, [businessData]);

    const inputClass = "w-[200px] border border-slate-300 rounded px-2 py-1 h-7 text-[11px] outline-none transition-all shadow-sm text-right bg-white text-slate-700 focus:border-blue-500";

    return (
        <div className="space-y-4 p-2 animate-in fade-in duration-500" dir="rtl">
            <div className="flex justify-between items-center px-1">
                <h2 className="text-lg font-bold text-slate-800">ניהול מפעילים ורשתות</h2>
            </div>

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
                                <FilterRow label="סינון לפי מצב רשת">
                                    <select
                                        className={inputClass}
                                        value={filters.networkStatus}
                                        onChange={(e) => setFilters(prev => ({ ...prev, networkStatus: e.target.value }))}
                                    >
                                        <option value="">-ללא-</option>
                                        <option value="Y">פעיל</option>
                                        <option value="N">לא פעיל</option>
                                    </select>
                                </FilterRow>
                            </div>
                        </div>
                        <div className="flex justify-start gap-2 mt-6 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setFilters({ operatorName: '', networkStatus: '' })}
                                className="border border-slate-300 bg-slate-50 text-slate-600 px-6 py-1.5 rounded text-xs font-bold hover:bg-slate-100 transition-all"
                            >
                                איפוס
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* הטבלה המקורית מוגשת עם הנתונים המסוננים */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="flex justify-between items-center p-3 border-b border-slate-100 bg-slate-50/30">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        רשימת מפעילים רשומים ({filteredBusinessData.length})
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={loadData}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all shadow-none hover:shadow-sm"
                            title="רענן נתונים"
                        >
                            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <button
                            onClick={() => { setSelectedOperator(null); setIsOpModalOpen(true); }}
                            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all shadow-sm active:scale-95"
                        >
                            <Plus size={14} />
                            מפעיל חדש
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 flex flex-col items-center justify-center">
                        <div className="w-8 h-8 border-4 border-blue-100 border-b-blue-600 rounded-full animate-spin mb-3" />
                        <span className="text-slate-400 font-bold text-xs">טוען נתונים...</span>
                    </div>
                ) : (
                    <BusinessNetworksTable
                        businesses={filteredBusinessData} // מפעילים מסוננים
                        networks={filteredNetworksData}   // רשתות מסוננות (חשוב!)
                        onRefresh={loadData}
                        onEditOperator={(op: any) => { setSelectedOperator(op); setIsOpModalOpen(true); }}
                        onAddNetwork={handleAddNetwork}
                        onEditNetwork={handleEditNetwork}
                    />
                )}
            </div>

            <SetOperatorModal isOpen={isOpModalOpen} onClose={() => setIsOpModalOpen(false)} operatorData={selectedOperator} existingOperators={businessData} onConfirm={handleSetOperator} loading={opLoading} serverError={opServerError} />

            <NetworkEditModal
                isOpen={isNetModalOpen}
                onClose={() => setIsNetModalOpen(false)}
                operator={targetOperator}
                network={selectedNet}
                onConfirm={handleSetNetwork}
                loading={netLoading}
                serverError={netServerError}
            />
        </div>
    );
};