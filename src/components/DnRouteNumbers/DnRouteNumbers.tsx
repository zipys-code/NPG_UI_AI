import React, { useState } from 'react';
import { List } from 'lucide-react';
import { DnRouteNumbersFilters } from './DnRouteNumbersFilters';
import { DnRouteNumbersGrid } from './DnRouteNumbersGrid';
import { apiRequest } from "@/services/api";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";

const formatToLegacyDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [date, time] = dateStr.split('T');
    const [y, m, d] = date.split('-');
    return `${d}/${m}/${y} ${time}`;
};

const DnRouteNumbers = () => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const { currentNetworkId, token } = useApp();
    const [isHistoryView, setIsHistoryView] = useState(false);
    const [lastAppliedFilters, setLastAppliedFilters] = useState<any>(null);
    const [isFiltersOpen, setIsFiltersOpen] = useState(true);

    const handleSearch = async (filters: any) => {
        setLoading(true);
        // 1. איפוס מיידי - מבטיח שהמסך יתנקה ברגע שלחצו על הכפתור
        setResults([]);
        setIsHistoryView(filters.includeHistory);
        setLastAppliedFilters(filters);

        const payload = {
            getIn: {
                DNSelectedValue: filters.filterByNum || '',
                DN: filters.mobileStart || '',
                DNTo: filters.mobileEnd || '',
                DNSelectedHistory: filters.includeHistory ? 'Y' : 'N',
                ByDateRange: filters.selectByDate,
                DateFrom: filters.selectByDate === '1' ? formatToLegacyDate(filters.fromDate) : '',
                DateTo: filters.selectByDate === '1' ? formatToLegacyDate(filters.toDate) : '',
                AbandonedOperator: filters.operatorDonor || '',
                ReceiverOperator: filters.operatorRecipient || '',
                NetworkType: filters.networkType || '',
                token: token,
                RouteType: filters.portType || '',
                RequestID: filters.requestId || '',
                selfNetworkID: currentNetworkId,
                validLNPP: 'Y'
            }
        };

        try {
            const response = await apiRequest('/GetPortedNumbers', payload);
            const getOut = response?.getOut || response;

            // חילוץ הודעת הסטטוס
            const msgData = getOut?.notification?.msg?.[0] || getOut?.notification?.msg;
            const statusCode = msgData?.code;

            if (statusCode === "1000") {
                const rows = getOut.data?.dataGrid?.row;
                const normalizedData = Array.isArray(rows) ? rows : (rows ? [rows] : []);
                setResults(normalizedData);
                if (normalizedData.length > 0) {
                    setIsFiltersOpen(false);
                }
            } else {
                setResults([]);
                toast.error(msgData?.msgBody || "שגיאה בנתוני השאילתה", {
                    duration: Infinity,
                    action: {
                        label: 'הבנתי',
                        onClick: () => console.log('Closed'),
                    },
                });
            }
        } catch (err) {
            // 3. שגיאת תקשורת/קריסה
            setResults([]);
            console.error("Communication Error:", err);
            toast.error("שגיאת תקשורת מול השרת", {
                duration: Infinity, // לא ייעלם אוטומטית
                action: {
                    label: 'הבנתי',
                    onClick: () => console.log('Closed'),
                },
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 bg-slate-50 min-h-screen rtl" dir="rtl">
            <div className="flex items-center gap-3 mb-6">
                <List size={24} className="text-slate-600" />
                <h1 className="text-2xl font-bold text-slate-800">נתוני ניוד</h1>
            </div>
            <DnRouteNumbersFilters
                onFilter={handleSearch}
                onReset={() => setResults([])}
                isOpen={isFiltersOpen}
                setIsOpen={setIsFiltersOpen}
            />
            <div className="mt-6">
                <DnRouteNumbersGrid
                    data={results}
                    loading={loading}
                    showHistory={isHistoryView}
                    appliedFilters={lastAppliedFilters}
                //={setIsFiltersOpen}
                />
            </div>
        </div>
    );
};

export default DnRouteNumbers;