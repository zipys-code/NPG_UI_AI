import React, { useState, useEffect } from 'react';
import { apiRequest } from "@/services/api";
import { useApp } from "@/context/AppContext";
import { Plus, AlertCircle, X, CheckCircle, RefreshCcw } from 'lucide-react';
import { BusinessNetworksTable } from './BusinessNetworksTable';
import { SetOperatorModal } from './SetOperatorModal';
import { NetworkEditModal } from './NetworkEditModal'; // המודאל החדש
import { toast } from "sonner";

export const NetworksManager = () => {
    const { token, currentNetworkId, currentUser } = useApp();
    const [loading, setLoading] = useState(true);
    const [businessData, setBusinessData] = useState([]);
    const [networksData, setNetworksData] = useState([]);
    const [systemMessage, setSystemMessage] = useState<{ msg: string, severity: string } | null>(null);

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

    useEffect(() => { loadData(); }, [currentNetworkId]);

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

    // --- לוגיקה חדשה: שליחת רשת לשרת (SetOperatorRegistryNetwork) ---
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
                    NetworkType: formData.NetworkType, // יעבור כ-M או F
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

    return (
        <div className="space-y-6 p-2 animate-in fade-in duration-500">
            {/* כותרת הדף - עכשיו נקייה ודקה יותר */}
            <div className="flex justify-between items-center px-1">
                <h2 className="text-lg font-bold text-slate-800">ניהול מפעילים ורשתות</h2>
            </div>

            {/* גוף המסך - הטבלה המכילה את הכפתורים בתוכה */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Header פנימי של הטבלה עם הכפתורים */}
                <div className="flex justify-between items-center p-3 border-b border-slate-100 bg-slate-50/30">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">רשימת מפעילים רשומים</div>
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
                        businesses={businessData}
                        networks={networksData}
                        onRefresh={loadData}
                        onEditOperator={(op: any) => { setSelectedOperator(op); setIsOpModalOpen(true); }}
                        onAddNetwork={handleAddNetwork}
                        onEditNetwork={handleEditNetwork}
                    />
                )}
            </div>

            <SetOperatorModal isOpen={isOpModalOpen} onClose={() => setIsOpModalOpen(false)} operatorData={selectedOperator} existingOperators={businessData} onConfirm={handleSetOperator} loading={opLoading} serverError={opServerError} />

            {/* עדכון הקריאה למודאל הרשתות עם ה-Props הנכונים */}
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
//backup