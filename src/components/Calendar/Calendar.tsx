import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
    Plus,
    RotateCcw,
    Edit3,
    Trash2,
    Calendar as CalendarIcon,
    Settings2,
    Clock,
    CalendarDays,
    List
} from 'lucide-react';
import { apiRequest } from "@/services/api";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";

import { AddEditCalendarModal } from "./AddEditCalendarModal";
import { ConfirmDeleteModal } from "../Share/ConfirmDeleteModal";
import { SetCalendarExceptionModal } from './SetCalendarExceptionModal';
import { SetWeeklyScheduleModal } from './SetWeeklyScheduleModal';

const parseDate = (dateStr: string) => {
    if (!dateStr) return new Date(0);
    // הפיכת dd/mm/yyyy לאובייקט Date בר השוואה
    const [day, month, year] = dateStr.split('/').map(Number);
    return new Date(year, month - 1, day);
};

export const Calendar: React.FC = () => {
    const { currentNetworkId, currentUser, token } = useApp();

    // States לניהול נתונים
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'weekly' | 'exceptions'>('weekly');
    const [isWeeklyOpen, setIsWeeklyOpen] = useState(false);
    const [isExceptionOpen, setIsExceptionOpen] = useState(false);
    const [selectedRowData, setSelectedRowData] = useState<any>(null);

    // States למודלים
    const [isAddEditOpen, setIsAddEditOpen] = useState(false);
    const [calendarToEdit, setCalendarToEdit] = useState<any>(null);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [calendarToDelete, setCalendarToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    // מיון תאריכים ביומן חריגים
    const [exceptionSortOrder, setExceptionSortOrder] = useState<'asc' | 'desc'>('desc');

    // טעינת נתונים - שינינו חזרה ל-GetCalendar
    const fetchCalendars = useCallback(async () => {
        setLoading(true);
        try {
            const response = await apiRequest("/GetCalendar", {
                getIn: { token: token, selfNetworkID: currentNetworkId }
            });

            // חילוץ הנתונים לפי המבנה שרואים ב-Response בצילום המסך
            const getOut = response?.root?.getOut || response?.getOut;
            const serverData = getOut?.data;

            if (serverData) {
                setData(serverData);

                // בחירת ID ראשוני אם לא נבחר עדיין
                const rows = serverData.systemCalendar?.rowSC;
                const rowsArray = Array.isArray(rows) ? rows : (rows ? [rows] : []);
                if (rowsArray.length > 0 && !selectedCalendarId) {
                    setSelectedCalendarId(rowsArray[0].calendarID);
                }
            }
        } catch (err) {
            toast.error("שגיאת תקשורת בטעינת יומנים");
        } finally {
            setLoading(false);
        }
    },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [currentNetworkId]);

    useEffect(() => {
        fetchCalendars();
    }, [fetchCalendars]);

    // לוגיקה לחילוץ נתוני היומן הנבחר (Detail)
    const currentCalendar = useMemo(() => {
        const rows = data?.systemCalendar?.rowSC;
        const rowsArray = Array.isArray(rows) ? rows : (rows ? [rows] : []);
        return rowsArray.find((c: any) => c.calendarID === selectedCalendarId);
    }, [data, selectedCalendarId]);

    const weeklyTimes = useMemo(() => {
        const rows = data?.weeklySchedule?.rowWS || [];
        const rowsArray = Array.isArray(rows) ? rows : [rows];


        return rowsArray.filter((w: any) => w.systemCalendarID === selectedCalendarId);
    }, [data, selectedCalendarId]);

    const exceptionDays = useMemo(() => {
        const list = data?.calendarException?.rowCE || data?.calendarException;
        if (!list) return [];

        const array = Array.isArray(list) ? list : [list];

        // סינון ומיון
        return array
            .filter((e: any) => e.systemCalendarID === selectedCalendarId)
            .sort((a, b) => {
                const dateA = parseDate(a.date).getTime();
                const dateB = parseDate(b.date).getTime();
                // המיון תלוי ב-State שלנו
                if (exceptionSortOrder === 'desc') {
                    return dateB - dateA; // מאוחר למוקדם
                } else {
                    return dateA - dateB; // מוקדם למאוחר
                }
            });
    }, [data, selectedCalendarId, exceptionSortOrder]);

    // פונקציית מחיקה
    const handleDelete = async (calendar: any) => {
        if (!calendar) return;

        // בדיקה שלא מוחקים יומן כללי (אם יש לך לוגיקה כזו)
        if (calendar.profile === "כללי") {
            toast.error("לא ניתן למחוק יומן כללי");
            return;
        }
        setIsDeleting(true);
        try {
            await apiRequest("/AddNewCalendar", {
                setIn: {
                    user: currentUser?.name || "אורח",
                    selfNetworkID: currentNetworkId,
                    action: "DELETE",
                    data: { calendarId: calendarToDelete.calendarID }
                }
            });
            toast.success("היומן נמחק בהצלחה");
            fetchCalendars();
        } catch (e) {
            toast.error("שגיאה במחיקה");
        } finally {
            setIsDeleting(false);
            setIsDeleteOpen(false);
        }
    };

    const handleDeleteSubItem = async (row: any, type: 'weekly' | 'exceptions') => {
        const isWeekly = type === 'weekly';
        const confirmMsg = isWeekly
            ? `האם למחוק את שעות הפעילות ליום ${row.day}?`
            : `האם למחוק את החריג לתאריך ${row.date}?`;

        if (!window.confirm(confirmMsg)) return;

        const dayToCode: Record<string, string> = {
            "ראשון": "1", "שני": "2", "שלישי": "3", "רביעי": "4",
            "חמישי": "5", "שישי": "6", "שבת": "7"
        };

        try {
            const dayValue = isWeekly
                ? (dayToCode[row.day?.toString().trim()] || row.day)
                : row.day;

            const payload = {
                setIn: {
                    mode: isWeekly ? "DELETE_WEEK_DAY" : "DELETE_EXCEPTION_DAY",
                    calendarId: selectedCalendarId,
                    token: token,
                    selfNetworkID: currentNetworkId,
                    user: currentUser?.name || "מערכת",
                    // שדות ספציפיים לכל סוג
                    ...(isWeekly ? {
                        weeklySchedularId: row.weeklyScheduleID,
                        day: dayValue
                    } : {
                        /* date: row.date,
                        originalDay: row.date,
                        originalSobh: row.SoBH */
                        date: row.date,
                        SoBH: row.SoBH,
                        EoBH: row.EoBH,
                        originalDay: row.date,
                        originalSobh: row.SoBH
                    })
                }
            };

            const endpoint = isWeekly ? "/SetWeeklySchedule" : "/SetCalendarException";
            const response = await apiRequest(endpoint, payload);
            const notification = response?.setOut?.notification?.msg?.[0];

            if (notification?.code?.toString() === "1000") {
                toast.success("נמחק בהצלחה");
                fetchCalendars(); // רענון הנתונים בטבלה
            } else {
                toast.error(notification?.msgBody || "שגיאה במחיקה");
            }
        } catch (error) {
            toast.error("שגיאת תקשורת בביצוע המחיקה");
        }
    };

    return (
        <div className="flex-1 p-6 space-y-6 animate-in fade-in duration-500" dir="rtl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <List size={20} className="text-slate-400" />
                    <h2 className="text-xl font-bold text-slate-800">הגדרות יומן</h2>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => { setCalendarToEdit(null); setIsAddEditOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 transition-all"
                    >
                        <Plus size={16} />
                        <span>הוסף יומן חדש</span>
                    </button>
                    <button onClick={fetchCalendars} className="p-2 border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600">
                        <RotateCcw size={18} />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                {/* טבלת יומנים (ימין) */}
                <div className="xl:col-span-3 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-sm font-bold text-slate-700">יומני המערכת</h3>
                    </div>
                    <div className="overflow-auto max-h-[500px]">
                        <table className="w-full text-right">
                            <thead className="sticky top-0 bg-white z-10 shadow-sm">
                                <tr className="text-slate-400 text-[12px] uppercase">
                                    <th className="px-4 py-3 font-bold border-b border-slate-100">שם היומן</th>
                                    <th className="px-4 py-3 font-bold border-b border-slate-100">תיאור</th>
                                    <th className="px-4 py-3 font-bold border-b border-slate-100">פרופיל</th>
                                    <th className="text-center px-4 py-3 font-bold border-b border-slate-100 w-24">פעולות</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={4} className="p-10 text-center"><Loader2 className="animate-spin inline text-blue-600" /></td></tr>
                                ) : (
                                    (Array.isArray(data?.systemCalendar?.rowSC) ? data.systemCalendar.rowSC : (data?.systemCalendar?.rowSC ? [data.systemCalendar.rowSC] : [])).map((c: any) => (
                                        <tr key={c.calendarID} onClick={() => setSelectedCalendarId(c.calendarID)}
                                            className={`cursor-pointer transition-all border-l-4 ${selectedCalendarId === c.calendarID ? 'bg-blue-50/70 border-l-blue-600' : 'hover:bg-slate-50 border-l-transparent'}`}>
                                            <td className="px-4 py-4 text-[13px] font-bold text-blue-900">{c.calendarName}</td>
                                            <td className="px-4 py-4 text-[12px] text-slate-600 truncate max-w-[200px]">{c.desc}</td>
                                            <td className="px-4 py-4 text-[12px] text-slate-500">
                                                {(() => {
                                                    const p = (c.profile || c.PROFILE || "").toString().trim();
                                                    if (p === 'M') return 'נייד';
                                                    if (p === 'F_S') return 'נייח יחיד';
                                                    if (p === 'F_R') return 'נייח טווח';
                                                    if (p === '' || p === 'כללי') return 'כללי';
                                                    return p;
                                                })()}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex justify-center gap-1">
                                                    <button onClick={(e) => { e.stopPropagation(); setCalendarToEdit(c); setIsAddEditOpen(true); }} className="p-1.5 text-blue-500 hover:bg-white rounded shadow-sm"><Edit3 size={14} /></button>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (window.confirm(`האם למחוק את היומן "${c.calendarName}"?`)) {
                                                                handleDelete(c);
                                                            }
                                                        }}
                                                        className="p-1.5 text-red-400 hover:bg-white rounded shadow-sm"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* פירוט יומן וטאבים (שמאל) */}
                <div className="xl:col-span-2 bg-white rounded-2xl shadow-xl border border-slate-100 flex flex-col min-h-[500px]">
                    <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                        <h3 className="text-sm font-bold text-slate-700 italic">פירוט: {currentCalendar?.calendarName || 'בחר יומן'}</h3>
                    </div>

                    <div className="flex items-center justify-between border-b border-slate-100 px-4 bg-white">
                        <div className="flex">
                            <TabBtn active={activeTab === 'weekly'} onClick={() => setActiveTab('weekly')} icon={Clock} label="שעות" />
                            <TabBtn active={activeTab === 'exceptions'} onClick={() => setActiveTab('exceptions')} icon={CalendarDays} label="חריגים" />
                        </div>
                        <button
                            onClick={() => {
                                setSelectedRowData(null);
                                if (activeTab === 'weekly') setIsWeeklyOpen(true);
                                else setIsExceptionOpen(true);
                            }}
                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold shadow-sm transition-all active:scale-95"
                        >
                            <Plus size={14} />
                            <span>{activeTab === 'weekly' ? 'הוספת שעות' : 'הוספת יום חריג'}</span>
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
                                    <div className="flex gap-3 justify-start">
                                        <Edit3
                                            size={14}
                                            className="text-blue-500 cursor-pointer hover:text-blue-700 transition-colors"
                                            onClick={() => { setSelectedRowData(t); setIsWeeklyOpen(true); }}
                                        />
                                        <Trash2
                                            size={14}
                                            className="text-red-400 cursor-pointer hover:text-red-600 transition-colors"
                                            onClick={() => handleDeleteSubItem(t, 'weekly')}
                                        />
                                    </div>
                                ])}
                            />
                        ) : (
                            <InnerTable
                                headers={[
                                    <div
                                        className="flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors"
                                        onClick={() => setExceptionSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                                    >
                                        <span>תאריך</span>
                                        <span className="text-[10px]">{exceptionSortOrder === 'desc' ? '▼' : '▲'}</span>
                                    </div>,
                                    'פתיחה',
                                    'סגירה',
                                    'פעיל',
                                    'פעולות'
                                ]}
                                data={exceptionDays.map((t: any) => [
                                    <span className="font-mono text-blue-700">{t.date}</span>,
                                    t.SoBH,
                                    t.EoBH,
                                    t.workDay === "1" ? <span className="text-emerald-500 font-bold">V</span> : <span className="text-red-400 font-bold">X</span>,
                                    <div className="flex gap-3 justify-start">
                                        <Edit3
                                            size={14}
                                            className="text-blue-500 cursor-pointer hover:text-blue-700 transition-colors"
                                            onClick={() => { setSelectedRowData(t); setIsExceptionOpen(true); }}
                                        />
                                        <Trash2
                                            size={14}
                                            className="text-red-400 cursor-pointer hover:text-red-600 transition-colors"
                                            onClick={() => handleDeleteSubItem(t, 'exceptions')}
                                        />
                                    </div>
                                ])}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* מודלים */}
            <AddEditCalendarModal
                isOpen={isAddEditOpen}
                onClose={() => { setIsAddEditOpen(false); setCalendarToEdit(null); }}
                onSuccess={fetchCalendars}
                editData={calendarToEdit}
            />

            {/* מודאל שעות שבועיות */}
            <SetWeeklyScheduleModal
                isOpen={isWeeklyOpen}
                onClose={() => { setIsWeeklyOpen(false); setSelectedRowData(null); }}
                onSuccess={fetchCalendars}
                calendarId={selectedCalendarId || ""}
                editData={selectedRowData}
            />

            {/* מודאל ימים חריגים */}
            <SetCalendarExceptionModal
                isOpen={isExceptionOpen}
                onClose={() => { setIsExceptionOpen(false); setSelectedRowData(null); }}
                onSuccess={fetchCalendars}
                calendarId={selectedCalendarId || ""}
                editData={selectedRowData}
            />
        </div>
    );
};

// רכיבי עזר קטנים
const Loader2 = ({ className }: any) => <RotateCcw className={`animate-spin ${className}`} />;
const TabBtn = ({ active, onClick, icon: Icon, label }: any) => (
    <button onClick={onClick} className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 -mb-[2px] transition-all ${active ? 'border-b-blue-600 text-blue-700' : 'border-b-transparent text-slate-400 hover:text-blue-500'}`}>
        <Icon size={14} /> {label}
    </button>
);
const InnerTable = ({ headers, data }: any) => (
    <table className="w-full text-right text-[11px]">
        <thead>
            <tr className="bg-slate-50/30">
                {headers.map((h: any) => (
                    <th key={h} className="px-3 py-2 text-slate-400 font-bold border-b border-slate-100">{h}</th>
                ))}
            </tr>
        </thead>
        <tbody>
            {data.length === 0 ? (
                <tr><td colSpan={headers.length} className="p-8 text-center text-slate-300 italic">אין נתונים</td></tr>
            ) : (
                data.map((row: any, i: number) => (
                    <tr key={i} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                        {row.map((cell: any, j: number) => (
                            <td key={j} className="px-3 py-2 text-slate-600">{cell}</td>
                        ))}
                    </tr>
                ))
            )}
        </tbody>
    </table>
);