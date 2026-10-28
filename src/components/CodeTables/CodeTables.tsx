import React, { useState, useEffect, useMemo } from 'react';
import { Search, ChevronDown, ChevronUp, Database, X, Save, AlertCircle } from 'lucide-react';
import { useApp } from "@/context/AppContext";
import { apiRequest } from "@/services/api";
import { toast } from "sonner";

// פונקציית עזר להמרת תאריך מ-YYYY-MM-DD ל-DD/MM/YYYY
const formatDate = (dateStr: string) => {
    if (!dateStr || String(dateStr).trim() === '') return '-';
    try {
        const [datePart] = dateStr.split('T');
        const [year, month, day] = datePart.split('-');
        if (year && month && day) return `${day}/${month}/${year}`;
        return dateStr;
    } catch {
        return dateStr;
    }
};

export default function CodeTables() {
    const { token, currentNetworkId, roleId, currentUser } = useApp();
    const isAdmin = roleId === 'NPG_ADMINISTRATOR';

    const [rawData, setRawData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    // סטייטים לפילטרים
    const [searchTerm, setSearchTerm] = useState('');
    const [includeHistory, setIncludeHistory] = useState(true);

    // סטייטים לאקורדיונים 
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

    // סטייטים לעריכה ושמירה
    const [edits, setEdits] = useState<Record<string, any>>({});
    const [saving, setSaving] = useState(false);
    const [serverError, setServerError] = useState<string | null>(null);

    const toggleGroup = (groupId: string) => {
        setExpandedGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
    };

    const toggleItem = (itemKey: string) => {
        setExpandedItems(prev => ({ ...prev, [itemKey]: !prev[itemKey] }));
    };

    // שליפת הנתונים מהשרת
    const fetchCodeTables = async () => {
        setLoading(true);
        setServerError(null);
        try {
            const res = await apiRequest('/GetConfigValues', {
                getIn: { token, selfNetworkID: currentNetworkId }
            });

            const items = res?.getOut?.ConfigItems?.ConfigItem || [];
            const itemsArray = Array.isArray(items) ? items : [items];

            // מוסיפים ID ייחודי לכל רשומה כדי שנוכל לעקוב אחרי העריכות
            const itemsWithId = itemsArray.map((item, index) => ({
                ...item,
                _id: `row_${index}`
            }));

            setRawData(itemsWithId);
            setEdits({}); // איפוס עריכות ברענון
        } catch (err) {
            console.error("Error fetching code tables:", err);
            setServerError("שגיאת תקשורת בטעינת הנתונים");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCodeTables();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentNetworkId, token]);

    // טיפול בשינוי ערך בתא (רק למנהלים)
    const handleCellEdit = (rowId: string, field: string, value: string) => {
        if (!isAdmin) return;

        setEdits(prev => {
            const originalRow = rawData.find(r => r._id === rowId);
            if (!originalRow) return prev;

            const updatedEdits = { ...prev };

            // אתחול הרשומה בעריכות אם היא עוד לא קיימת
            if (!updatedEdits[rowId]) {
                updatedEdits[rowId] = { ...originalRow };
            }

            updatedEdits[rowId][field] = value;
            return updatedEdits;
        });
    };

    // שמירת הנתונים לשרת
    const handleSave = async () => {
        const editedRows = Object.values(edits);
        if (editedRows.length === 0) return;

        // בניית הפיילוד לשרת לפי הסכמה
        const payloadItems = editedRows.map(row => {
            const item: any = {
                group_id: row.group_id || '',
                item_id: row.item_id || '',
                entity_id: row.entity_id || '',
                item_value: row.item_value || '',
                item_attribute1: row.item_attribute1 || '',
                item_attribute2: row.item_attribute2 || '',
                item_attribute3: row.item_attribute3 || '',
                last_update_by: currentUser?.name || 'admin'
            };

            return item;
        });

        setSaving(true);
        setServerError(null);

        try {
            const res = await apiRequest('/SetConfigValues', {
                setIn: {
                    ConfigItems: {
                        ConfigItem: payloadItems
                    }
                }
            });

            const rawMessages = res?.setOut?.notification?.msg;
            const msgs = Array.isArray(rawMessages) ? rawMessages : (rawMessages ? [rawMessages] : []);

            // חיפוש שגיאה
            const errorMsg = msgs.find(m => String(m.code) !== '1000');

            if (errorMsg) {
                setServerError(errorMsg.msgBody || `שגיאה בשמירה (קוד: ${errorMsg.code})`);
            } else {
                toast.success("הנתונים עודכנו בהצלחה!");
                setEdits({});
                await fetchCodeTables(); // רענון הנתונים מהשרת
            }
        } catch (err) {
            setServerError("שגיאת תקשורת מול השרת בעת שמירת הנתונים");
        } finally {
            setSaving(false);
        }
    };

    // הלוגיקה החכמה: מסננת ומקבצת
    const groupedData = useMemo(() => {
        let filtered = rawData;

        // סינון היסטוריה
        if (!includeHistory) {
            filtered = filtered.filter(item => !item.valid_to || String(item.valid_to).trim() === '');
        }

        // סינון חיפוש חופשי (כולל חיפוש על הערכים הערוכים אם המשתמש בדיוק מקליד)
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(originalItem => {
                const item = edits[originalItem._id] || originalItem; // חיפוש עובד גם על מה שנערך כרגע!
                return (
                    (item.group_id?.toLowerCase().includes(term)) ||
                    (item.item_id?.toLowerCase().includes(term)) ||
                    (item.item_value?.toLowerCase().includes(term)) ||
                    (item.entity_id?.toLowerCase().includes(term)) ||
                    (item.item_attribute1?.toLowerCase().includes(term)) ||
                    (item.item_attribute2?.toLowerCase().includes(term)) ||
                    (item.item_attribute3?.toLowerCase().includes(term))
                );
            });
        }

        // קיבוץ היררכי
        const hierarchy: Record<string, Record<string, any[]>> = {};

        filtered.forEach(item => {
            const grandParent = item.group_id || 'ללא קבוצה';
            const parent = item.item_id || 'ללא פריט';

            if (!hierarchy[grandParent]) hierarchy[grandParent] = {};
            if (!hierarchy[grandParent][parent]) hierarchy[grandParent][parent] = [];

            hierarchy[grandParent][parent].push(item);
        });

        return hierarchy;
    }, [rawData, searchTerm, includeHistory, edits]);

    const hasEdits = Object.keys(edits).length > 0;

    // קומפוננטת עזר לתא שניתן לעריכה
    // קומפוננטת עזר לתא שניתן לעריכה
    const EditableCell = ({ row, field }: { row: any, field: string }) => {
        const currentValue = edits[row._id]?.[field] ?? row[field] ?? '';
        const isEdited = edits[row._id] !== undefined && edits[row._id][field] !== row[field];

        // בדיקה אם הרשומה היסטורית (יש לה תאריך תפוגה)
        const isHistorical = row.valid_to && String(row.valid_to).trim() !== '';

        // חסימת עריכה למי שאינו מנהל *או* לרשומות היסטוריות
        if (!isAdmin || isHistorical) {
            return <td className="px-3 py-2 text-slate-600">{currentValue || '-'}</td>;
        }

        return (
            <td className={`px-2 py-1 transition-colors ${isEdited ? 'bg-blue-50' : ''}`}>
                <input
                    type="text"
                    value={currentValue}
                    onChange={(e) => handleCellEdit(row._id, field, e.target.value)}
                    className={`w-full px-2 py-1 text-xs outline-none transition-all border rounded ${isEdited
                            ? 'border-blue-300 text-blue-700 font-bold bg-white'
                            : 'border-transparent hover:border-slate-300 bg-transparent focus:border-blue-400 focus:bg-white'
                        }`}
                />
            </td>
        );
    };

    return (
        <div className="p-4 bg-slate-50 min-h-screen rtl animate-in fade-in pb-24" dir="rtl">

            <div className="flex items-center gap-3 mb-6">
                <Database size={24} className="text-[#4B9CD3]" />
                <h1 className="text-2xl font-bold text-slate-800">טבלאות קוד</h1>
            </div>

            {/* הודעת שגיאה באדום במידה ויש קוד שונה מ-1000 */}
            {serverError && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <AlertCircle size={20} className="text-red-600" />
                        <span className="font-bold">{serverError}</span>
                    </div>
                    <button onClick={() => setServerError(null)} className="hover:bg-red-100 p-1 rounded-full transition-colors">
                        <X size={18} />
                    </button>
                </div>
            )}

            {/* אזור הפילטרים */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-6 mb-6">
                <div className="relative w-72">
                    <Search className="absolute right-3 top-2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="חיפוש חופשי..."
                        className="w-full pl-8 pr-9 py-1.5 border border-slate-300 rounded text-sm outline-none focus:border-blue-500 transition-all h-8 shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute left-2 top-2 text-slate-400 hover:text-slate-600 transition-colors"
                            title="נקה חיפוש"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="historyToggle"
                        className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
                        checked={includeHistory}
                        onChange={(e) => setIncludeHistory(e.target.checked)}
                    />
                    <label htmlFor="historyToggle" className="text-[12px] font-bold text-slate-600 cursor-pointer select-none">
                        כולל היסטוריה
                    </label>
                </div>
            </div>

            {/* אזור התצוגה ההיררכית - אקורדיונים */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200">
                    <div className="w-8 h-8 border-4 border-blue-100 border-b-blue-600 rounded-full animate-spin mb-3" />
                    <span className="text-slate-400 font-bold text-xs">טוען נתונים מהשרת...</span>
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
                    {Object.keys(groupedData).length === 0 ? (
                        <div className="text-center text-slate-500 py-10 font-medium">לא נמצאו תוצאות לסינון המבוקש</div>
                    ) : (
                        <div className="space-y-3">
                            {Object.entries(groupedData).map(([groupId, itemsMap]) => {
                                const isGroupOpen = expandedGroups[groupId];
                                const groupItemCount = Object.values(itemsMap).flat().length;

                                return (
                                    <div key={groupId} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                                        <div
                                            className="px-4 py-3 flex justify-between items-center cursor-pointer hover:bg-slate-100 transition-colors"
                                            onClick={() => toggleGroup(groupId)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-blue-800 text-sm">קבוצה: {groupId}</span>
                                                <span className="text-[11px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                                                    {groupItemCount} רשומות
                                                </span>
                                            </div>
                                            {isGroupOpen ? <ChevronUp size={18} className="text-blue-600" /> : <ChevronDown size={18} className="text-slate-400" />}
                                        </div>

                                        {isGroupOpen && (
                                            <div className="p-3 border-t border-slate-200 bg-white space-y-3">
                                                {Object.entries(itemsMap).map(([itemId, children]) => {
                                                    const itemKey = `${groupId}-${itemId}`;
                                                    const isItemOpen = expandedItems[itemKey];

                                                    return (
                                                        <div key={itemId} className="border border-slate-100 rounded-lg overflow-hidden shadow-sm">
                                                            <div
                                                                className="px-4 py-2 flex justify-between items-center cursor-pointer bg-blue-50/30 hover:bg-blue-50 transition-colors border-b border-slate-50"
                                                                onClick={() => toggleItem(itemKey)}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-bold text-slate-700 text-xs">פריט: {itemId}</span>
                                                                    <span className="text-[10px] text-slate-500">({children.length} רשומות)</span>
                                                                </div>
                                                                {isItemOpen ? <ChevronUp size={16} className="text-blue-500" /> : <ChevronDown size={16} className="text-slate-400" />}
                                                            </div>

                                                            {isItemOpen && (
                                                                <div className="overflow-x-auto p-1 bg-white">
                                                                    <table className="w-full text-right text-xs">
                                                                        <thead>
                                                                            <tr className="text-slate-500 bg-slate-50 border-b border-slate-200 whitespace-nowrap">
                                                                                <th className="px-3 py-2 font-semibold w-1/6">ערך (Value)</th>
                                                                                <th className="px-3 py-2 font-semibold">יישות (Entity)</th>
                                                                                <th className="px-3 py-2 font-semibold w-1/6">תכונה 1</th>
                                                                                <th className="px-3 py-2 font-semibold w-1/6">תכונה 2</th>
                                                                                <th className="px-3 py-2 font-semibold w-1/6">תכונה 3</th>
                                                                                <th className="px-3 py-2 font-semibold">עודכן ע"י</th>
                                                                                <th className="px-3 py-2 font-semibold">מתאריך</th>
                                                                                <th className="px-3 py-2 font-semibold">עד תאריך</th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {children.map((child) => (
                                                                                <tr key={child._id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors whitespace-nowrap">
                                                                                    <EditableCell row={child} field="item_value" />
                                                                                    <td className="px-3 py-2 text-slate-600">{child.entity_id || '-'}</td>
                                                                                    <EditableCell row={child} field="item_attribute1" />
                                                                                    <EditableCell row={child} field="item_attribute2" />
                                                                                    <EditableCell row={child} field="item_attribute3" />
                                                                                    <td className="px-3 py-2 text-slate-600">{child.last_update_by || '-'}</td>
                                                                                    <td className="px-3 py-2 text-slate-600">{formatDate(child.valid_from)}</td>
                                                                                    <td className="px-3 py-2 text-slate-600">{formatDate(child.valid_to)}</td>
                                                                                </tr>
                                                                            ))}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* סרגל עריכה תחתון (מופיע רק כשיש שינויים למנהל) */}
            {hasEdits && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_15px_rgba(0,0,0,0.05)] p-4 z-[100] animate-in slide-in-from-bottom-5">
                    <div className="max-w-7xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-bold text-sm">
                                {Object.keys(edits).length} רשומות שונו
                            </div>
                            <span className="text-sm text-slate-500 font-medium">
                                יש לשמור כדי להחיל את השינויים במערכת
                            </span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setEdits({})}
                                disabled={saving}
                                className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                            >
                                בטל הכל
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold shadow-md hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:bg-slate-400"
                            >
                                {saving ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Save size={18} />
                                )}
                                שמור שינויים
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}