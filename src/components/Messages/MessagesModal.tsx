import React, { useState, useEffect } from 'react';
import { X, MessageSquare } from 'lucide-react';
import { apiRequest } from "@/services/api";
import { useApp } from "@/context/AppContext";
import { GetMessagesGrid } from '../Messages/GetMessagesGrid'; // ודאי נתיב נכון

export const MessagesModal = ({ requestId, isOpen, onClose }: any) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const { currentNetworkId, token } = useApp();

    useEffect(() => {
        if (isOpen && requestId) fetchMessages();
    }, [isOpen, requestId]);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const payload = {
                getIn: {
                    mode: "GET_MESSAGES",
                    selfNetworkID: currentNetworkId,
                    token: token,
                    txtRequestId: requestId,
                    slctMsgType: '',
                    txtMsgStatus: '',
                    // שליחת תאריכי דמה כפי שביקשת
                    cldrDateFrom: '01/01/2000',
                    txtTimeFrom: '00:00',
                    cldrDateTo: '01/01/2400',
                    txtTimeTo: '00:00',
                    SourceForm: "UI_PROCESS_DETAILS"
                }
            };
            const response = await apiRequest("/GetMessages", payload);
            const rows = response?.getOut?.dataGrid?.row || [];
            setData(Array.isArray(rows) ? rows : [rows]);
        } catch (error) {
            console.error("Error modal messages:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-6">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95">
                <div className="p-4 bg-slate-50 border-b flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <MessageSquare className="text-blue-600" size={20} />
                        <span className="font-bold text-slate-800">מסרים עבור בקשה: {requestId}</span>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-full transition-all"><X size={20} /></button>
                </div>
                <div className="flex-1 overflow-auto p-4">
                    <GetMessagesGrid data={data} loading={loading} appliedFilters={{ requestId }} />
                </div>
            </div>
        </div>
    );
};