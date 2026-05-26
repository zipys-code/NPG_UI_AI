import React, { useState, useMemo } from 'react';
import {
    ChevronDown, ChevronUp, Mail, Phone, User,
    Settings2, Globe, PlusSquare, Check, X,
    Link, Fingerprint, Settings, ArrowUpDown,
    Pencil
} from 'lucide-react';

// --- קומפוננטת עזר לאייקונים (V ירוק / X אדום) ---
const BooleanIcon = ({ value, isStatus }: { value: any, isStatus?: boolean }) => {
    const isTrue = value === true || value === "true" || value === "1" || value === 1;

    if (isStatus) {
        return (
            <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${isTrue ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                <div className={`w-1 h-1 rounded-full ${isTrue ? 'bg-green-500' : 'bg-red-500'}`} />
                {isTrue ? 'פעיל' : 'כבוי'}
            </div>
        );
    }

    return isTrue ?
        <Check size={14} className="mx-auto text-green-600 font-bold" strokeWidth={3} /> :
        <X size={14} className="mx-auto text-red-500 font-bold" strokeWidth={3} />;
};

// --- הטבלה הפנימית (Networks) ---
const InnerNetworksTable = ({ networks, onEditNetwork }: { networks: any[], onEditNetwork: (net: any) => void }) => {
    return (
        <div className="overflow-x-auto border border-blue-100 rounded-lg shadow-inner bg-white">
            <table className="w-full text-right text-[11px]">
                <thead className="bg-blue-50/50 border-b border-blue-100">
                    <tr className="h-9">
                        <th className="px-3 font-bold text-blue-800">שם רשת</th>
                        <th className="px-3 font-bold text-blue-800">מזהה רשת</th>
                        <th className="px-3 font-bold text-blue-800 text-center">סוג</th>
                        <th className="px-3 font-bold text-blue-800 text-center">זיהוי עצמי</th>
                        <th className="px-3 font-bold text-blue-800 text-center">כשר</th>
                        <th className="px-3 font-bold text-blue-800">יחידות טווח</th>
                        <th className="px-3 font-bold text-blue-800">LRN פנימי</th>
                        <th className="px-3 font-bold text-blue-800 text-center">מזהה פנימי</th>
                        <th className="px-3 font-bold text-blue-800 text-center">סטטוס</th>
                        <th className="px-3 font-bold text-blue-800">URL</th>
                        <th className="px-3 font-bold text-blue-800 text-left w-8">ערוך</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {networks.length > 0 ? networks.map((net: any) => (
                        <tr key={net.NetworkId} className="hover:bg-slate-50 transition-colors h-10">
                            <td className="px-3 font-bold text-slate-700">{net.NetworkName}</td>
                            <td className="px-3 font-mono font-bold text-slate-900 text-[10px]">{net.NetworkIdentifier}</td>
                            <td className="px-3 text-center">
                                <span className="text-[10px] text-slate-600">
                                    {String(net.NetworkType).includes('נייד') || net.NetworkType === 'M' ? 'נייד' : 'נייח'}
                                </span>
                            </td>
                            <td className="px-3 text-center"><BooleanIcon value={net.NetworkSelfIdentity} /></td>
                            <td className="px-3 text-center"><BooleanIcon value={net.KosherFlag} /></td>
                            <td className="px-3 text-slate-600">{net.RangeUnit || '-'}</td>
                            <td className="px-3 text-slate-600 font-medium">{net.AliasNetworkLRN || '-'}</td>
                            <td className="px-3 text-center text-slate-500">{net.AliasNetworkId || '-'}</td>
                            <td className="px-3 text-center"><BooleanIcon value={net.Enabled} isStatus /></td>
                            <td className="px-3 max-w-[150px] truncate text-blue-600/70 italic text-[10px]" title={net.OutgoingURL}>
                                {net.OutgoingURL}
                            </td>
                            <td className="px-3 text-left">
                                <button
                                    onClick={() => onEditNetwork(net)} // פתיחת עריכה לרשת
                                    className="p-1 hover:text-blue-600 text-slate-400"
                                >
                                    <Settings size={14} />
                                </button>
                            </td>
                        </tr>
                    )) : (
                        <tr><td colSpan={11} className="p-4 text-center text-slate-400 italic">אין רשתות מוגדרות</td></tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

// --- הטבלה הראשית (Businesses) ---
export const BusinessNetworksTable = ({
    businesses,
    networks,
    onEditOperator,
    onRefresh,
    onAddNetwork,
    onEditNetwork
}: {
    businesses: any[],
    networks: any[],
    onEditOperator: (op: any) => void,
    onRefresh: () => void,
    onAddNetwork: (op: any) => void,
    onEditNetwork: (net: any, op: any) => void
}) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

    const sortedBusinesses = useMemo(() => {
        const list = [...businesses];
        return list.sort((a, b) => {
            const nameA = a.BusinessName || "";
            const nameB = b.BusinessName || "";
            return sortDir === 'asc'
                ? nameA.localeCompare(nameB, 'he')
                : nameB.localeCompare(nameA, 'he');
        });
    }, [businesses, sortDir]);

    const toggleSort = () => setSortDir(sortDir === 'asc' ? 'desc' : 'asc');

    return (
        <table className="w-full text-right border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="h-10">
                    <th className="w-8 px-2"></th>
                    <th className="px-3 text-[11px] font-bold text-slate-500 uppercase cursor-pointer hover:text-blue-600 transition-colors" onClick={toggleSort}>
                        <div className="flex items-center gap-1">
                            שם מפעיל
                            <ArrowUpDown size={12} className={sortDir ? 'text-blue-600' : 'text-slate-300'} />
                        </div>
                    </th>
                    <th className="px-3 text-[11px] font-bold text-slate-500 uppercase">איש קשר</th>
                    <th className="px-3 text-[11px] font-bold text-slate-500 uppercase">פרטי התקשרות</th>
                    <th className="px-3 text-[11px] font-bold text-slate-500 uppercase text-left">פעולות</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
                {sortedBusinesses.map((biz: any) => (
                    <React.Fragment key={biz.BusinessId}>
                        <tr
                            className={`hover:bg-blue-50/30 transition-colors cursor-pointer h-10 ${expandedId === biz.BusinessId ? 'bg-blue-50/50' : ''}`}
                            onClick={() => setExpandedId(expandedId === biz.BusinessId ? null : biz.BusinessId)}
                        >
                            <td className="px-2 text-center">
                                {expandedId === biz.BusinessId ? <ChevronUp size={14} className="text-blue-600" /> : <ChevronDown size={14} className="text-slate-400" />}
                            </td>
                            <td className="px-3">
                                <span className="text-xs font-bold text-slate-700">{biz.BusinessName}</span>
                                <span className="text-[10px] text-slate-400 mr-2">({biz.BusinessId})</span>
                            </td>
                            <td className="px-3 text-[11px] text-slate-600 font-medium">{biz.ContactName || '-'}</td>
                            <td className="px-3">
                                <div className="flex items-center gap-4 text-[11px] text-slate-500">
                                    <span className="flex items-center gap-1"><Mail size={11} /> {biz.EmailAddress}</span>
                                    <span className="flex items-center gap-1"><Phone size={11} /> {biz.PhoneNumber}</span>
                                </div>
                            </td>
                            <td className="px-3 text-left">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEditOperator(biz); // חיבור הכפתור בטבלה הראשית
                                    }}
                                    className="p-1.5 hover:bg-white rounded text-slate-400 hover:text-blue-600 border border-transparent hover:border-slate-200 transition-all group relative"
                                    title="עריכת מפעיל"
                                >
                                    <Pencil size={14} />
                                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10 shadow-xl">
                                        עריכת מפעיל
                                    </span>
                                </button>
                            </td>
                        </tr>

                        {expandedId === biz.BusinessId && (
                            <tr>
                                <td colSpan={5} className="p-0 bg-slate-50/30">
                                    <div className="p-4 border-y border-blue-100 animate-in fade-in duration-200">
                                        <div className="flex justify-between items-center mb-3 px-1">
                                            <h4 className="text-[10px] font-bold text-blue-700 flex items-center gap-1.5">
                                                <Globe size={12} /> רשתות עבור {biz.BusinessName}
                                            </h4>

                                            <button
                                                onClick={() => onAddNetwork(biz)}
                                                className="flex items-center gap-1.5 text-[10px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 transition-all group"
                                            >
                                                <PlusSquare size={13} className="group-hover:scale-110 transition-transform" />
                                                הוסף רשת חדשה
                                            </button>
                                        </div>
                                        <InnerNetworksTable
                                            networks={networks.filter((n: any) => n.NetworkBusinessId === biz.BusinessId)}
                                            onEditNetwork={(net) => onEditNetwork(net, biz)} // מעביר את הרשת ואת המפעיל האבא
                                        />
                                    </div>
                                </td>
                            </tr>
                        )}
                    </React.Fragment>
                ))}
            </tbody>
        </table>
    );
};
//backup