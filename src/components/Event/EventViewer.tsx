import React, { useState } from 'react';
import { LayoutList } from 'lucide-react';
import { EventViewerFilters } from './EventViewerFilters';
import { EventViewerGrid } from './EventViewerGrid'
import { apiRequest } from "@/services/api";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";

const EventViewer = () => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const { currentNetworkId, token } = useApp();
    const [appliedFilters, setAppliedFilters] = useState<any>(null);
    const [isOpen, setIsOpen] = useState(true);

    const handleSearch = async (filters: any) => {
        setLoading(true);
        setResults([]);
        setAppliedFilters(filters);

        // מפרקים את התאריך והשעה חזרה לפורמט שטיבקו מצפה לו
        const fromDateParts = filters.fromDate.split('T');
        const toDateParts = filters.toDate.split('T');

        const formatToTibco = (dateStr: string) => {
            const [y, m, d] = dateStr.split('-');
            return `${d}/${m}/${y}`;
        };

        const payload = {
            getIn: {
                EventType: filters.eventType || '',
                EventClass: filters.eventClass || '',
                EventRequestId: filters.requestId || '',
                severity: filters.severity || '',
                fromDate: formatToTibco(fromDateParts[0]),
                toDate: formatToTibco(toDateParts[0]),
                fromHour: fromDateParts[1] || '00:00',
                toHour: toDateParts[1] || '23:59',
                EventId: filters.eventId || '',
                token: token,
                selfNetworkID: currentNetworkId
            }
        };

        try {
            const response = await apiRequest('/GetEventList', payload);
            const getOut = response?.getOut;
            const notification = getOut?.notification || response?.notification;
            const msgData = notification?.msg?.[0] || notification?.msg;
            const statusCode = msgData?.code?.["$"] || msgData?.code;
            const msgBody = msgData?.msgBody?.["$"] || msgData?.msgBody;

            if (statusCode === "1000") {
                const rows = getOut?.dataGrid?.row;
                const normalizedData = Array.isArray(rows) ? rows : (rows ? [rows] : []);
                setResults(normalizedData);

                if (normalizedData.length > 0) {
                    setIsOpen(false);
                    toast.success(`נמצאו ${normalizedData.length} אירועים`);
                } else {
                    toast.info(msgBody || "לא נמצאו רשומות");
                }
            } else {
                toast.error(msgBody || "שגיאה בשליפת נתונים");
            }
        } catch (err) {
            toast.error("שגיאת תקשורת מול השרת");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 bg-slate-50 min-h-screen rtl" dir="rtl">
            <div className="flex items-center gap-3 mb-6">
                <LayoutList size={24} className="text-[#4B9CD3]" />
                <h1 className="text-2xl font-bold text-slate-800">צפייה באירועים</h1>
            </div>
            <EventViewerFilters
                onFilter={handleSearch}
                onReset={() => { setResults([]); setIsOpen(true); }}
                isOpen={isOpen}
                setIsOpen={setIsOpen}
            />
            <div className="mt-6">
                <EventViewerGrid
                    data={results}
                    loading={loading}
                    appliedFilters={appliedFilters}
                />
            </div>
        </div>
    );
};

export default EventViewer;