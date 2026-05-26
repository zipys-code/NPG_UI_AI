import React, { useState } from 'react';
import { Hash, Plus } from 'lucide-react';
import { NumberingPlanFilters } from './NumberingPlanFilters';
import { NumberingPlanGrid } from './NumberingPlanGrid';
import { AddEditNumberingPlanModal } from './AddEditNumberingPlanModal';
import { apiRequest } from "@/services/api";
import { useApp } from "@/context/AppContext";
import { format } from "date-fns";
import { toast } from "sonner";

const INITIAL_FILTERS = {
    validity: 'Active',
    dateFrom: format(new Date().setFullYear(new Date().getFullYear() - 1), 'yyyy-MM-dd'),
    dateTo: format(new Date(), 'yyyy-MM-dd'),
    operator: '',
    network: '',
    tollFree: '0',
    numberFilterType: '0',
    dnNumber: '',
    fromNumber: '',
    toNumber: '',
    kosherFilter: '0'
};

const NumberingPlan = () => {
    const { currentUser, currentNetworkId, token } = useApp();
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState<any>(null);
    const [isFiltersOpen, setIsFiltersOpen] = useState(true);

    const handleReset = () => {
        setFilters(INITIAL_FILTERS); // איפוס השדות בטופס
        setResults([]);              // איפוס הגריד
    };

    const [filters, setFilters] = useState({
        validity: 'Active',
        dateFrom: format(new Date().setFullYear(new Date().getFullYear() - 1), 'yyyy-MM-dd'),
        dateTo: format(new Date(), 'yyyy-MM-dd'),
        operator: '',
        network: '',
        tollFree: '0',
        numberFilterType: '0',
        dnNumber: '',
        fromNumber: '',
        toNumber: '',
        kosherFilter: '0'
    });

    const handleSearch = async () => {
        setLoading(true);
        setResults([]);

        try {
            let numFilter = "0";
            if (filters.numberFilterType === 'Single') numFilter = "Single";
            if (filters.numberFilterType === 'Range') numFilter = "Range";

            const payload = {
                getIn: {
                    ByNumberFilter: numFilter,
                    DN: filters.numberFilterType === 'Single' ? filters.dnNumber : (filters.numberFilterType === 'Range' ? filters.fromNumber : ""),
                    DNto: filters.numberFilterType === 'Range' ? filters.toNumber : "",
                    DNSelectedHistory: filters.validity,
                    ByDateRange: "1",
                    DateFrom: filters.validity === 'History' ? format(new Date(filters.dateFrom), 'dd/MM/yyyy') : "",
                    DateTo: filters.validity === 'History' ? format(new Date(filters.dateTo), 'dd/MM/yyyy') : "",
                    ByOperator: filters.operator || "",
                    NetworkType: filters.network || "",
                    ByKosherNumber: filters.kosherFilter,
                    ByTollFree: filters.tollFree,
                    token: token,
                    selfNetworkID: currentNetworkId
                }
            };

            // 1. שליחת הבקשה
            const response = await apiRequest('/GetNumberingPlan', payload);

            // 2. אם apiRequest החזיר null, זה אומר שהייתה שגיאה (קוד != 1000)
            // וה-toast כבר הוצג בתוך ה-api.ts
            if (!response) {
                setResults([]);
                return;
            }

            const getOut = response.getOut || response;

            const rows =
                getOut.data?.dataGrid?.row ||      // המבנה שרואים בתמונה החדשה
                getOut.NationalNumberingPlan?.Record || // המבנה הישן
                getOut.row ||                      // גיבוי למקרה שה-row שטוח
                null;

            if (rows) {
                const normalizedData = Array.isArray(rows) ? rows : [rows];
                setResults(normalizedData);
                setIsFiltersOpen(false);
                toast.success(`נמצאו ${normalizedData.length} רשומות`);
            } else {
                setResults([]);
                toast.info("לא נמצאו רשומות התואמות לחיפוש");
            }

        } catch (err) {
            console.error("Search Error:", err);
            // טיפול במקרה של קריסה פיזית של התקשורת
            toast.error("שגיאת תקשורת חריגה בביצוע החיפוש");
        } finally {
            setLoading(false);
        }
    };

    // פונקציה לפתיחת מודאל הוספה
    const handleAddNew = () => {
        setSelectedRow(null); // מוודאים שאין נתונים קודמים (מצב Add)
        setIsModalOpen(true);
    };

    // פונקציה לפתיחת מודאל עריכה (תופעל מהגריד)
    const handleEdit = (row: any) => {
        setSelectedRow(row); // טוענים את נתוני השורה (מצב Edit)
        setIsModalOpen(true);
    };

    return (
        <div className="p-4 bg-slate-50 min-h-screen rtl" dir="rtl">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Hash size={24} className="text-slate-600" />
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">תוכנית מספור ארצית</h1>
                </div>
                <button
                    onClick={handleAddNew}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md">
                    <Plus size={16} /> הוסף חדש
                </button>
            </div>

            <NumberingPlanFilters
                filters={filters}
                setFilters={setFilters}
                onSearch={handleSearch}
                onReset={() => {
                    handleReset();
                    setIsFiltersOpen(true);
                }}
                isOpen={isFiltersOpen}
                setIsOpen={setIsFiltersOpen}

            />

            <NumberingPlanGrid
                data={results}
                loading={loading}
                filters={filters}
                userName={currentUser?.name || 'אורח'}
                onEdit={handleEdit}
            />
            <AddEditNumberingPlanModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleSearch} // רענון תוצאות אחרי שמירה
                editData={selectedRow}
            />

        </div>
    );
};

export default NumberingPlan;