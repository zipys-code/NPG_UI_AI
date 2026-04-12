import React, { useState } from 'react';
import { List } from 'lucide-react';
import { DnRouteNumbersFilters } from './DnRouteNumbersFilters';
import { DnRouteNumbersGrid } from './DnRouteNumbersGrid';
import { apiRequest } from "@/services/api";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";

const formatToLegacyDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
        const [date, time] = dateStr.split('T');
        const [y, m, d] = date.split('-');
        return `${d}/${m}/${y} ${time}`;
    } catch (e) {
        return dateStr; // במקרה של שגיאה, נחזיר את המקור כדי לא לשבור את האפליקציה
    }
};

const DnRouteNumbers = () => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const { currentNetworkId, currentUser } = useApp();

    const handleSearch = async (filters: any) => {
        setLoading(true);
        setResults([]); // איפוס תוצאות קודמות לפני חיפוש חדש

        // 1. בניית ה-Payload לפי מבנה ה-TIBCO שראינו בצילום
        const payload = {
            getIn: {
                DNSelectedValue: filters.filterByNum || '',
                DN: filters.mobileStart || '',
                DNTo: filters.mobileEnd || '',
                DNSelectedHistory: filters.includeHistory ? 'Y' : 'N',
                ByDateRange: filters.selectByDate, // '0' או '1'
                DateFrom: filters.selectByDate === '1' ? formatToLegacyDate(filters.fromDate) : '',
                DateTo: filters.selectByDate === '1' ? formatToLegacyDate(filters.toDate) : '',
                AbandonedOperator: filters.operatorDonor || '',
                ReceiverOperator: filters.operatorRecipient || '',
                NetworkType: filters.networkType || '',
                RouteType: filters.portType || '',
                RequestID: filters.requestId || '',
                selfNetworkID: currentNetworkId,
                validLNPP: 'Y'
            }
        };

        try {
            // 2. קריאה לשרת (apiRequest מקבל נתיב ו-payload בלבד)
            const response = await apiRequest('/GetPortedNumbers', payload);

            // 3. לפי ה-Console, ה-response הוא כבר האובייקט הפנימי (מכיל notification ו-data)
            const getOut = response;

            if (!getOut?.notification || !getOut?.data) {
                console.error("Structure received:", Object.keys(response || {}));
                throw new Error("Invalid server response structure");
            }

            // 4. בדיקת סטטוס הצלחה (קוד 1000)
            const msgData = getOut.notification.msg?.[0] || getOut.notification.msg;
            const statusCode = msgData?.code;

            if (statusCode === "1000") {
                // 5. חילוץ השורות מתוך data -> dataGrid -> row
                const rows = getOut.data?.dataGrid?.row;

                // נרמול למערך (כי TIBCO מחזיר אובייקט במקרה של רשומה בודדת)
                const normalizedData = Array.isArray(rows) ? rows : (rows ? [rows] : []);

                setResults(normalizedData);
            } else {
                toast.error(msgData?.msgBody || "השרת החזיר שגיאה");
            }
        } catch (err) {
            console.error("Communication Error:", err);
            toast.error("שגיאה בעיבוד נתוני שרת");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 bg-slate-50 min-h-screen rtl" dir="rtl">
            {/* כותרת דף גדולה ומיושרת למערכת */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <List size={24} className="text-slate-600" />
                    <h1 className="text-2xl font-bold text-slate-800">נתוני ניוד</h1>
                </div>
            </div>

            <DnRouteNumbersFilters
                onFilter={handleSearch}
                onReset={() => setResults([])}
            />

            <div className="mt-6">
                <DnRouteNumbersGrid data={results} loading={loading} />
            </div>
        </div>
    );
};

export default DnRouteNumbers;