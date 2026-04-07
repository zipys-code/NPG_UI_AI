import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Settings, Clock, CalendarDays, Trash2, Edit3, Loader2, AlertCircle, List, Lock } from 'lucide-react';
import { apiRequest } from "@/services/api";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

export const Calendar: React.FC = () => {
    const { currentNetworkId } = useApp();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'weekly' | 'exceptions'>('weekly');

    useEffect(() => {
        const fetchCalendars = async () => {
            setLoading(true);
            try {
                const response = await apiRequest("/GetCalendar", {
                    getIn: { token: "", selfNetworkID: currentNetworkId || "320" }
                });

                const getOut = response?.root?.getOut || response?.getOut;
                const notification = getOut?.notification?.msg?.[0];

                if (notification?.code !== "1000") {
                    toast.error(`${notification?.msgBody || "שגיאה בטעינה"} (${notification?.code})`);
                    return;
                }

                const serverData = getOut?.data;
                if (serverData) {
                    setData(serverData);
                    const rows = serverData.systemCalendar?.rowSC;
                    const firstId = Array.isArray(rows) ? rows[0]?.calendarID : rows?.calendarID;
                    if (firstId) setSelectedCalendarId(firstId);
                }
            } catch (err) {
                toast.error("שגיאת תקשורת בטעינת יומנים");
            } finally {
                setLoading(false);
            }
        };
        fetchCalendars();
    }, [currentNetworkId]);

    const currentCalendar = useMemo(() =>
        data?.systemCalendar?.rowSC?.find((c: any) => c.calendarID === selectedCalendarId),
        [data, selectedCalendarId]
    );

    const weeklyTimes = useMemo(() =>
        (data?.weeklySchedule?.rowWS || []).filter((w: any) => w.systemCalendarID === selectedCalendarId),
        [data, selectedCalendarId]
    );

    const exceptionDays = useMemo(() =>
        (data?.calendarException?.rowCE || []).filter((e: any) => e.systemCalendarID === selectedCalendarId),
        [data, selectedCalendarId]
    );

    if (loading) return <div className="flex h-[400px] items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-blue-600" /></div>;

    return (
        <div className="flex-1 p-6 space-y-6 animate-in fade-in duration-500" dir="rtl">
            {/* כותרת דף ראשית */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <List size={20} className="text-slate-400" />
                    <h2 className="text-xl font-bold text-slate-800">הגדרות יומן</h2>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm">
                    <Plus size={16} className="text-blue-600" />
                    <span>הוסף יומן חדש</span>
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                {/* טבלת יומנים (ימין) */}
                <div className="xl:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-sm font-bold text-slate-700">יומני המערכת</h3>
                    </div>
                    <div className="overflow-auto max-h-[500px]">
                        <table className="w-full text-right">
                            <thead className="sticky top-0 bg-white z-10">
                                <tr>
                                    <th className="px-4 py-3 font-bold text-[12px] text-slate-400 border-b border-slate-100">שם היומן</th>
                                    <th className="px-4 py-3 font-bold text-[12px] text-slate-400 border-b border-slate-100">תיאור</th>
                                    <th className="text-center px-4 py-3 font-bold text-[12px] text-slate-400 border-b border-slate-100 w-24">פעולות</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data?.systemCalendar?.rowSC?.map((c: any) => (
                                    <tr key={c.calendarID} onClick={() => setSelectedCalendarId(c.calendarID)}
                                        className={`cursor-pointer transition-all border-l-4 ${selectedCalendarId === c.calendarID ? 'bg-blue-50/70 border-l-blue-600' : 'hover:bg-slate-50 border-l-transparent'}`}>
                                        <td className="px-4 py-4 text-[13px] font-bold text-blue-900">{c.calendarName}</td>
                                        <td className="px-4 py-4 text-[12px] text-slate-600 truncate max-w-[250px]">{c.desc}</td>
                                        <td className="px-4 py-4"><div className="flex justify-center gap-1">
                                            <ActionButton icon={Edit3} color="text-blue-500" />
                                            <ActionButton icon={Trash2} color="text-red-400" />
                                        </div></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* פירוט יומן (שמאל) */}
                <div className="xl:col-span-2 bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col min-h-[500px]">
                    {/* כותרת זהה בעיצוב לימין */}
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-sm font-bold text-slate-700">פירוט יומן: {currentCalendar?.calendarName}</h3>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-100 px-4 bg-white">
                        <div className="flex">
                            <TabBtn active={activeTab === 'weekly'} onClick={() => setActiveTab('weekly')} icon={Clock} label="שעות שבועיות" />
                            <TabBtn active={activeTab === 'exceptions'} onClick={() => setActiveTab('exceptions')} icon={CalendarDays} label="חריגים" />
                        </div>
                        {/* כפתור הוספה מהיר לפי הטאב הפעיל */}
                        <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="הוסף רשומה">
                            <Plus size={18} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-auto p-2">
                        {activeTab === 'weekly' ? (
                            <InnerTable
                                headers={['יום', 'פתיחה', 'סגירה', 'פעולות']}
                                data={weeklyTimes.map((t: any) => [
                                    <span className="font-bold text-slate-700">{t.day}</span>,
                                    t.SoBH,
                                    t.EoBH,
                                    <div className="flex gap-2">
                                        <button className="text-slate-400 hover:text-blue-600"><Edit3 size={14} /></button>
                                        <button className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                                    </div>
                                ])}
                            />
                        ) : (
                            <InnerTable
                                headers={['תאריך', 'פתיחה', 'סגירה', 'פעיל', '']}
                                data={exceptionDays.map((t: any) => [
                                    <span className="font-mono text-blue-700">{t.date}</span>,
                                    t.SoBH,
                                    t.EoBH,
                                    t.workDay === "1" ? <span className="text-emerald-500 font-bold">V</span> : <span className="text-red-400 font-bold">X</span>,
                                    <button className="text-slate-400 hover:text-red-500"><Trash2 size={14} /></button>
                                ])}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

// רכיבי עזר
const ActionButton = ({ icon: Icon, color }: any) => (
    <button className={`p-1.5 ${color} hover:bg-white rounded shadow-sm border border-transparent hover:border-slate-100 transition-all`}>
        <Icon size={14} />
    </button>
);

const TabBtn = ({ active, onClick, icon: Icon, label }: any) => (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all border-b-2 -mb-[2px] ${active ? 'border-b-blue-600 text-blue-700' : 'border-b-transparent text-slate-500 hover:text-blue-500'}`}>
        <Icon size={14} /> {label}
    </button>
);

const InnerTable = ({ headers, data }: any) => {
    if (data.length === 0) return <div className="p-12 text-center text-slate-400 text-xs italic">אין נתונים רלוונטיים</div>;
    return (
        <table className="w-full text-right text-[11px]">
            <thead>
                <tr className="bg-slate-50/30">
                    {headers.map((h: string) => <th key={h} className="px-3 py-2 text-slate-400 font-bold border-b border-slate-100">{h}</th>)}
                </tr>
            </thead>
            <tbody>
                {data.map((row: any[], i: number) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        {row.map((cell, j) => <td key={j} className="px-3 py-2.5 text-slate-600">{cell}</td>)}
                    </tr>
                ))}
            </tbody>
        </table>
    );
};