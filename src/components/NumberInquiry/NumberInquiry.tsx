import React, { useState } from 'react';
import { ShieldQuestion, Plus, CheckCircle2, X } from 'lucide-react';
import { NumberInquiryFilters } from './NumberInquiryFilters';
import { NumberInquiryGrid } from './NumberInquiryGrid';
import { apiRequest } from "@/services/api";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";
import { AddInquiryModal } from './AddInquiryModal';

export default function NumberInquiry() {
    const { currentNetworkId, token, currentUser, lovs } = useApp();
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [serverSuccessMessages, setServerSuccessMessages] = useState<string[]>([]);
    const [serverErrors, setServerErrors] = useState<string[]>([]);

    const [filterValues, setFilterValues] = useState({
        dnNumber: '',
        operators: [],
        fromDate: new Date().toISOString().split('T')[0],
        toDate: new Date().toISOString().split('T')[0]
    });

    const handleSearch = async (filters: any) => {
        setFilterValues(filters);
        setLoading(true);
        try {
            const payload = {
                getIn: {
                    dnNumber: filters.dnNumber,
                    operators: Array.isArray(filters.operators) ? filters.operators.join(',') : filters.operators,
                    fromDate: filters.fromDate.split('-').reverse().join('/'),
                    toDate: filters.toDate.split('-').reverse().join('/'),
                    fromTime: filters.fromTime || "00:00",
                    toTime: filters.toTime || "23:59",
                    selfNetworkID: currentNetworkId,
                    token: token
                }
            };
            const response = await apiRequest('/GetNumberInquiry', payload);
            const data = response?.getOut?.data?.dataGrid?.row || [];
            setResults(Array.isArray(data) ? data : [data]);
        } catch (err) {
            toast.error("שגיאה בטעינת נתונים");
        } finally {
            setLoading(false);
        }
    };

    const handleAddNewInquiry = async (data: any) => {
        setServerErrors([]);
        setServerSuccessMessages([]);

        const operatorRows = data.operatorIds.map((id: string) => {
            const opName = lovs?.byBusiness?.item?.find((item: any) => item.value === id)?.label || id;
            return { operatorID: id, operatorName: opName };
        });

        const payload = {
            setIn: {
                user: currentUser?.name || 'אורח',
                DN: data.dnNumber,
                selfIdentity: currentNetworkId,
                operatorList: { row: operatorRows },
                token: token,
                selfNetworkID: currentNetworkId
            }
        };

        try {
            const response = await apiRequest('/SetNumberInquiry', payload);
            const setOut = response?.setOut || response;
            const msgArray = Array.isArray(setOut?.notification?.msg) ? setOut.notification.msg : [setOut?.notification?.msg];

            const successMsg = msgArray.find(m => m.code === "1000" && m.severity !== "ERROR");

            if (successMsg) {
                const details = msgArray.map(m => m.msgBody || "הבקשה נשלחה בהצלחה");
                setServerSuccessMessages(details);
                setIsAddModalOpen(false);

                // עדכון הפילטרים במסך וביצוע החיפוש
                const updatedFilters = {
                    dnNumber: data.dnNumber,
                    operators: data.operatorIds,
                    fromDate: new Date().toISOString().split('T')[0],
                    toDate: new Date().toISOString().split('T')[0],
                    fromTime: "00:00",
                    toTime: "23:59",
                    showHistory: false
                };

                handleSearch(updatedFilters);
                return { success: true };
            } else {
                const errors = msgArray.map(m => m.msgBody || "תקלה טכנית");
                setServerErrors(errors);
                return { success: false };
            }
        } catch (err) {
            setServerErrors(["שגיאת תקשורת מול השרת"]);
            return { success: false };
        }
    };

    const openAddModal = () => {
        setServerErrors([]);
        setServerSuccessMessages([]);
        setIsAddModalOpen(true);
    };

    return (
        <div className="p-6 bg-slate-50 min-h-screen rtl" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    {/* האייקון עכשיו נקי, בלי רקע כחול, עם הצבע התואם לשאר המסכים */}
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
                        className="lucide lucide-shield-question text-[#4B9CD3]"
                    >
                        <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"></path>
                        <path d="M9.1 9a3 3 0 0 1 5.82 1c0 2-3 3-3 3"></path>
                        <path d="M12 17h.01"></path>
                    </svg>
                    <h1 className="text-2xl font-bold text-slate-800">שאילתת מספר</h1>
                </div>

                {/* כפתור ה-Action נשאר בצד שמאל */}
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md transition-all active:scale-95">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus">
                        <path d="M5 12h14"></path>
                        <path d="M12 5v14"></path>
                    </svg>
                    <span>צור חדש</span>
                </button>
            </div>

            {/* הודעת הצלחה ירוקה בראש הדף עם פיצול לשורות */}
            {serverSuccessMessages.length > 0 && (
                <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4 shadow-sm animate-in fade-in slide-in-from-top-2">
                    <div className="flex justify-between items-start">
                        <div className="space-y-2">
                            <h4 className="text-emerald-800 font-bold text-sm flex items-center gap-2">
                                <CheckCircle2 size={16} /> הפעולה בוצעה בהצלחה
                            </h4>
                            <div className="mr-6 space-y-1.5">
                                {serverSuccessMessages.map((msg, i) => {
                                    // ניקוי תגיות ה-br ופיצול לשורות
                                    const cleanLines = msg.replace(/<\/br>/g, '\n').split('\n');

                                    return (
                                        <div key={i} className="flex flex-col gap-1">
                                            {cleanLines.map((line, lIdx) => (
                                                line.trim() && (
                                                    <p key={lIdx} className="text-emerald-700 text-[12px] font-medium leading-relaxed select-text flex items-center gap-2">
                                                        <span className="w-1 h-1 bg-emerald-400 rounded-full shrink-0" />
                                                        {line.trim()}
                                                    </p>
                                                )
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <button
                            onClick={() => setServerSuccessMessages([])}
                            className="text-emerald-400 hover:text-emerald-600 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>
            )}

            <NumberInquiryFilters
                onFilter={handleSearch}
                initialValues={filterValues}
                onReset={() => {
                    setResults([]);
                    setIsFilterOpen(true);
                    setFilterValues({
                        dnNumber: '',
                        operators: [],
                        fromDate: new Date().toISOString().split('T')[0],
                        toDate: new Date().toISOString().split('T')[0]
                    });
                }}
                isOpen={isFilterOpen}
                setIsOpen={setIsFilterOpen}
            />

            <AddInquiryModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSave={handleAddNewInquiry}
                serverErrors={serverErrors}
            />

            <div className="mt-8">
                {/* שינוי results ל-data כדי להתאים ל-Grid */}
                <NumberInquiryGrid data={results} loading={loading} />
            </div>
        </div>
    );
}