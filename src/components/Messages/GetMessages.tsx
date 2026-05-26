import React, { useState } from 'react';
import { useLocation } from 'react-router-dom'; // <-- הוספנו ייבוא
import { GetMessagesFilters } from './GetMessagesFilters';
import { GetMessagesGrid } from './GetMessagesGrid';
import { apiRequest } from "@/services/api";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";

const GetMessages = () => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const { currentNetworkId, token } = useApp();
    const [lastAppliedFilters, setLastAppliedFilters] = useState<any>(null);
    const [isFilterOpen, setIsFilterOpen] = useState(true);

    // --- קליטת הנתונים מהדשבורד ---
    const location = useLocation();
    const navigationState = location.state as { externalFilters?: any; autoSearch?: boolean } | null;
    const externalFilters = navigationState?.externalFilters || null;
    const autoSubmit = navigationState?.autoSearch || false;

    const handleSearch = async (filters: any) => {
        const start = new Date(`${filters.dateFrom}T${filters.timeFromHour}:${filters.timeFromMin}`);
        const end = new Date(`${filters.dateTo}T${filters.timeToHour}:${filters.timeToMin}`);

        if (start > end) {
            return;
        }

        setLoading(true);
        setResults([]);
        setLastAppliedFilters(filters);

        try {
            const payload = {
                getIn: {
                    mode: "GET_MESSAGES",
                    selfNetworkID: currentNetworkId,
                    token: token,
                    txtRequestId: filters.requestId || '',
                    slctMsgType: filters.msgType === 'None' ? '' : filters.msgType,
                    txtMsgStatus: filters.msgStatus === 'None' ? '' : filters.msgStatus,
                    // --- כאן אנחנו שולחים את המפעיל שהוספת בצד שרת ---
                    operatorName: filters.operator === 'None' ? '' : filters.operator,
                    cldrDateFrom: filters.dateFrom,
                    txtTimeFrom: filters.timeFrom,
                    cldrDateTo: filters.dateTo,
                    txtTimeTo: filters.timeTo,
                    SourceForm: "UI"
                }
            };

            const response = await apiRequest("/GetMessages", payload);
            const dataGrid = response?.getOut?.dataGrid?.row || [];
            const finalData = Array.isArray(dataGrid) ? dataGrid : [dataGrid];

            setResults(finalData);

            if (finalData.length === 0) {
                toast.info("לא נמצאו מסרים לחתך המבוקש");
            }
        } catch (err) {
            console.error("Search error:", err);
            toast.error("שגיאת תקשורת בטעינת המסרים");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 bg-slate-50 min-h-screen rtl" dir="rtl">
            <div className="flex items-center gap-3 mb-6">
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
                    className="lucide lucide-message-square text-[#4B9CD3]"
                >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                <h1 className="text-2xl font-bold text-slate-800">צפייה במסרים</h1>
            </div>

            <GetMessagesFilters
                onFilter={handleSearch}
                onReset={() => { setResults([]); setIsFilterOpen(true); }}
                isOpen={isFilterOpen}
                setIsOpen={setIsFilterOpen}
                externalFilters={externalFilters} // <-- העברה לפילטר
                autoSubmit={autoSubmit}           // <-- העברה לפילטר
            />

            <div className="mt-6">
                <GetMessagesGrid
                    data={results}
                    loading={loading}
                    appliedFilters={lastAppliedFilters}
                />
            </div>
        </div>
    );
};

export default GetMessages;