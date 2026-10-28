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
    },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [isOpen, requestId]);

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
        // מעטפת ממורכזת, בטוחה ולא נחתכת
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm" dir="rtl">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

                {/* ההדר הכחול והחדש! */}
                <div className="flex justify-between items-center px-6 py-4 bg-[#2563eb] text-white rounded-t-xl shadow-sm shrink-0">
                    <div className="flex items-center gap-3">
                        <MessageSquare size={22} />
                        <div className="flex flex-col gap-0.5">
                            <h3 className="font-bold text-lg leading-none">צפייה במסרים</h3>
                            <span className="text-[12.5px] font-medium text-blue-100 leading-none">בקשה מס': {requestId}</span>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="hover:bg-white/20 p-1.5 rounded-full transition-colors focus:outline-none"
                        title="סגור"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* אזור התוכן (הגריד) */}
                <div className="flex-1 overflow-auto bg-slate-50/50 p-6">
                    <GetMessagesGrid data={data} loading={loading} appliedFilters={{ requestId }} />
                </div>
            </div>
        </div>
    );
};