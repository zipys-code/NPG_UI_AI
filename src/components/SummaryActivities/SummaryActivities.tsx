import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Search, PieChart as PieChartIcon, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { apiRequest } from "@/services/api";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import { format } from "date-fns";

const SummaryActivities = () => {
    const navigate = useNavigate();
    const { currentNetworkId, token, roleId } = useApp();

    // --- States ---
    const [isLoading, setIsLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string>('');
    const [refreshTime, setRefreshTime] = useState<string>('1440');
    const [summaryData, setSummaryData] = useState<any>(null);

    // --- משיכת נתונים מהשרת ---
    const fetchSummaryData = async () => {
        setIsLoading(true);
        try {
            const payload = {
                getIn: {
                    refreshTime: parseInt(refreshTime),
                    selfNetworkID: currentNetworkId,
                    token: token
                }
            };

            const response = await apiRequest('/GetSummaryActivities', payload);
            const getOut = response?.getOut || response?.root?.getOut || response;
            const notification = getOut?.notification?.msg?.[0] || getOut?.notification?.msg;

            if (notification?.code?.toString() === "1000") {
                setSummaryData(getOut?.data);
                setLastUpdated(format(new Date(), 'dd/MM/yyyy HH:mm:ss'));
            } else {
                toast.error(notification?.msgBody || "שגיאה בטעינת הנתונים");
            }
        } catch (error) {
            toast.error("שגיאת תקשורת מול השרת");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSummaryData();
    },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [refreshTime, currentNetworkId]);

    const formatDateTimeLocal = (date: Date) => {
        const pad = (n: number) => n.toString().padStart(2, '0');
        return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    };

    // --- לוגיקת לחיצה על פלח בגרף העוגה ---
    const handlePieClick = (entry: any) => {
        const isManager = roleId === 'NPG_ADMINISTRATOR';
        const targetRoute = isManager ? '/manage-processes' : '/view-processes'; // תיקון הראוט!

        // חישוב זמנים לאחור לפי מה שנבחר ב-Select (1440, 60, 10 דקות)
        const toDate = new Date();
        const fromDate = new Date(toDate.getTime() - parseInt(refreshTime) * 60000);

        navigate(targetRoute, {
            state: {
                autoSearch: true,
                externalFilters: {
                    processType: entry.processType,     // יגיע מהעיבוד נתונים למטה
                    processStatus: entry.processStatus,
                    fromDateTime: formatDateTimeLocal(fromDate),
                    toDateTime: formatDateTimeLocal(toDate)
                }
            }
        });
    };

    // --- לוגיקת לחיצה על עמודה בגרף השגיאות ---
    const handleBarClick = (entry: any) => {
        // entry.messageTo מכיל את שם המפעיל (למשל: "סלקום")

        // חישוב זמנים זהה למה שעשינו בפאי
        const toDate = new Date();
        const fromDate = new Date(toDate.getTime() - parseInt(refreshTime) * 60000);

        // ניווט למסך הודעות (GetMessages) עם הפילטרים
        navigate('/GetMessages', {
            state: {
                autoSearch: true,
                externalFilters: {
                    operatorName: entry.messageTo, // זה השם שנעביר, תתאימי למפתח שיש לך במסך הודעות
                    fromDateTime: formatDateTimeLocal(fromDate),
                    toDateTime: formatDateTimeLocal(toDate)
                }
            }
        });
    };

    // --- עיבוד נתונים אמיתיים וצביעה חכמה ---
    const COLOR_PALETTES = [
        ['#1D4ED8', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD'], // 1. כחולים (נשאר)
        ['#047857', '#059669', '#10B981', '#34D399', '#6EE7B7'], // 2. ירוקים (נשאר)
        ['#CA8A04', '#EAB308', '#FACC15', '#FDE047', '#FEF08A'], // 3. צהובים / זהב
        ['#64748B', '#94A3B8', '#CBD5E1', '#E2E8F0', '#F1F5F9'], // 4. אפורים בהירים
    ];

    const pieData: any[] = [];
    const processTypesArr = summaryData?.processTypes?.processType;
    const normalizedTypes = Array.isArray(processTypesArr) ? processTypesArr : (processTypesArr ? [processTypesArr] : []);

    let typeIndex = 0;

    normalizedTypes.forEach((typeItem: any) => {
        const typeName = typeItem.processType || '';
        const statusArr = typeItem.processStatus;
        const normalizedStatuses = Array.isArray(statusArr) ? statusArr : (statusArr ? [statusArr] : []);

        const currentPalette = COLOR_PALETTES[typeIndex % COLOR_PALETTES.length];
        let statusIndex = 0;

        normalizedStatuses.forEach((stat: any) => {
            pieData.push({
                displayName: `${typeName} - ${stat.processStatus}`,
                processType: typeName, // הוספנו את השדה הזה כדי להעביר אותו במסך הבא!
                processStatus: stat.processStatus,
                count: parseInt(stat.count || 0),
                color: currentPalette[statusIndex % currentPalette.length]
            });
            statusIndex++;
        });
        typeIndex++;
    });

    // חילוץ הנתונים לגרף העמודות
    const rawBarData = summaryData?.MessagesFailures?.row;
    const barData = Array.isArray(rawBarData) ? rawBarData : (rawBarData ? [rawBarData] : []);

    return (
        <div className="p-4 bg-slate-50 min-h-screen rtl" dir="rtl">

            {/* --- אזור כותרת וחיפוש (Header) --- */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
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
                        className="lucide lucide-pie-chart text-[#4B9CD3]"
                    >
                        <path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path>
                        <path d="M22 12A10 10 0 0 0 12 2v10z"></path>
                    </svg>
                    <h1 className="text-2xl font-bold text-slate-800">סיכום פעילות</h1>
                </div>

                <button
                    onClick={() => navigate("/NumberInquiry")}
                    className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md transition-all active:scale-95"
                >
                    <Search size={18} />
                    <span>שאילתת מספר</span>
                </button>
            </div>

            {/* --- אזור שליטה וזמן תצוגה --- */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-600">זמן לתצוגה:</span>
                        <select
                            className="border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-sm font-extrabold text-blue-600 outline-none cursor-pointer focus:border-blue-500 transition-all"
                            value={refreshTime}
                            onChange={(e) => setRefreshTime(e.target.value)}
                            disabled={isLoading}
                        >
                            <option value="1440">24 שעות</option>
                            <option value="60">1 שעה</option>
                            <option value="10">10 דקות</option>
                        </select>
                    </div>

                    <div className="text-sm font-bold text-slate-400 mr-1 mt-1">
                        {lastUpdated ? `מוצג נכון לתאריך ושעה: ${lastUpdated}` : 'טוען נתונים...'}
                    </div>
                </div>

                <div className="flex items-center pt-1">
                    <button
                        onClick={fetchSummaryData}
                        disabled={isLoading}
                        className="flex items-center gap-2 px-5 py-2 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-sm font-bold hover:bg-slate-100 transition-all shadow-sm disabled:opacity-50"
                    >
                        <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                        <span>רענן</span>
                    </button>
                </div>
            </div>

            {/* --- אזור הגרפים המעודכן (חלוקת 12 עמודות - 7 לעוגה, 5 לעמודות) --- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* קארד 1: גרף עוגה מורחב (lg:col-span-7 וגובה h-[420px]) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col lg:col-span-7">
                    <div className="border-b border-slate-100 pb-3 mb-4">
                        <h2 className="text-sm font-bold text-slate-700">התפלגות תהליכים (סוג וסטטוס)</h2>
                    </div>

                    <div className="h-[420px] w-full relative flex items-center justify-center">
                        {isLoading && !summaryData ? (
                            <div className="text-slate-400 text-xs font-medium">מתקשר עם שרת TIBCO...</div>
                        ) : pieData.length === 0 ? (
                            <div className="text-red-500 font-bold text-xs bg-red-50 px-4 py-3 rounded-lg border border-red-100">
                                לא חזרו נתונים עבור זמן התצוגה המבוקש
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="45%"
                                        innerRadius={75}  // הגדלת הרדיוס הפנימי
                                        outerRadius={120} // הגדלת הרדיוס החיצוני בצורה משמעותית
                                        paddingAngle={2}
                                        dataKey="count"
                                        nameKey="displayName"
                                        onClick={handlePieClick}
                                        className="cursor-pointer outline-none"
                                        label={(props: any) => {
                                            const { x, y, cx, displayName, count } = props;
                                            return (
                                                <text
                                                    x={x}
                                                    y={y}
                                                    fill="#1e293b"
                                                    fontSize="9px"
                                                    fontWeight="bold"
                                                    textAnchor={x > cx ? 'start' : 'end'}
                                                    dominantBaseline="central"
                                                >
                                                    {`${displayName} (${count})`}
                                                </text>
                                            );
                                        }}
                                        labelLine={{ stroke: '#94a3b8', strokeWidth: 1 }}
                                    >
                                        {pieData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} className="hover:opacity-85 transition-opacity" />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={50} wrapperStyle={{ fontSize: '10px', paddingTop: '15px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                {/* קארד 2: גרף עמודות מצומצם (lg:col-span-5 כדי לפנות מקום לעוגה) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col lg:col-span-5">
                    <div className="border-b border-slate-100 pb-3 mb-4 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-700">כשלים בהפצת מסרים לפי יעד</h2>
                        <div className="bg-red-50 text-red-500 p-1 rounded-md">
                            <AlertTriangle size={16} />
                        </div>
                    </div>

                    <div className="h-[420px] w-full flex items-center justify-center">
                        {isLoading && !summaryData ? (
                            <div className="text-slate-400 text-xs font-medium">מחשב נתונים...</div>
                        ) : barData.length === 0 ? (
                            <div className="text-red-500 font-bold text-xs bg-red-50 px-4 py-3 rounded-lg border border-red-100">
                                לא חזרו נתונים עבור זמן התצוגה המבוקש
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={barData} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="messageTo" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{ fill: '#f8fafc' }} />
                                    <Bar
                                        dataKey="failures"
                                        fill="#EF4444"
                                        radius={[4, 4, 0, 0]}
                                        barSize={25}
                                        onClick={handleBarClick} // <-- הפונקציה שהוספנו
                                        className="cursor-pointer hover:opacity-80 transition-opacity" // <-- אפקט לחיצה
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SummaryActivities;