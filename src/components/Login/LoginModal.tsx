// src/components/Login/LoginModal.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { apiRequest } from "@/services/api";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { HIDDEN_MENUS } from "../App/AppConfig";

interface LoginModalProps {
    onSuccess: (userData: any) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onSuccess }) => {
    const navigate = useNavigate();
    const appContext = useApp(); // שליפה אחת בלבד של ה-Context

    // 1. כל ה-Hooks מסודרים בראש הקומפוננטה (חוק הברזל של React)
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [selectedDomain, setSelectedDomain] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const getSafeValue = (obj: any) => {
        if (!obj) return "";
        return typeof obj === 'object' ? obj["$"] : obj;
    };

    const domains = useMemo(() => {
        // גישה בטוחה ל-appContext גם אם הוא עדיין ריק
        const lovs = appContext?.lovs;
        if (!lovs || typeof lovs !== 'object') return [];

        try {
            const identityGroup = (lovs as any)?.selfIdentity;
            if (!identityGroup) return [];

            const items = identityGroup?.item || [];
            const itemsArray = Array.isArray(items) ? items : [items];

            return itemsArray.map((d: any) => ({
                value: getSafeValue(d?.value),
                display: getSafeValue(d?.displayValue)
            })).filter(d => d.value);
        } catch (e) {
            return [];
        }
    }, [appContext?.lovs]);

    const showDomainSelector = domains.length > 1;

    useEffect(() => {
        if (domains.length === 1 && domains[0].value) {
            setSelectedDomain(domains[0].value.toString());
        }
    }, [domains]);

    // 2. רק עכשיו מותר לעשות "יציאה מוקדמת"
    if (!appContext) return null;

    // 3. חילוץ סופי של המשתנים (עכשיו בטוח ש-appContext קיים)
    const { lovs, setCurrentNetworkId, setCurrentNetworkName, setCurrentUser, setAppData, setToken } = appContext;

    const inputClasses = "w-full h-[54px] rounded-xl border border-slate-200 bg-slate-50 px-4 text-right font-sans text-base text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all shadow-sm placeholder:text-slate-400";

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const initialLoginToken = `NP_${Date.now()}`;

        try {
            const response = await apiRequest("/GetLogin", {
                getIn: {
                    user: username,
                    password,
                    token: initialLoginToken,
                    selfNetworkID: selectedDomain
                }
            });

            const userData = response?.LoginResponse || response;

            if (userData && userData.Code === "1000") {
                const finalToken = userData.token || initialLoginToken;
                const finalRoleId = userData.roleID || userData.roleId;
                const finalName = userData.fullName || userData.name || username;

                setCurrentUser({
                    name: finalName,
                    roleId: finalRoleId,
                    token: finalToken
                });

                setToken(finalToken);
                setCurrentNetworkId(selectedDomain);

                if (lovs) {
                    const identityGroup = (lovs as any)?.selfIdentity;
                    const items = Array.isArray(identityGroup?.item) ? identityGroup.item : [identityGroup?.item];
                    const selectedNet = items.find((d: any) => String(getSafeValue(d?.value)) === String(selectedDomain));
                    if (selectedNet) {
                        setCurrentNetworkName(getSafeValue(selectedNet.displayValue));
                    }
                }

                const menuData = await apiRequest('/GetMenuList', {
                    getIn: {
                        roleID: finalRoleId,
                        selfNetworkID: selectedDomain,
                        token: finalToken
                    }
                });

                if (menuData) {
                    const menuDocs = menuData.data?.menuDoc;

                    if (menuDocs) {
                        const menuArray = Array.isArray(menuDocs) ? menuDocs : [menuDocs];

                        const filteredDocs = menuArray.filter((doc: any) => {
                            const title = doc.text?.["$"] || doc.text;
                            return !HIDDEN_MENUS.includes(title);
                        });

                        filteredDocs.forEach((doc: any) => {
                            if (doc.items?.item && Array.isArray(doc.items.item)) {
                                doc.items.item = doc.items.item.filter((subItem: any) => {
                                    const subTitle = subItem.text?.["$"] || subItem.text;
                                    return !HIDDEN_MENUS.includes(subTitle);
                                });
                            }
                        });

                        menuData.data.menuDoc = filteredDocs;
                    }

                    setAppData({ menu: menuData });
                }

                onSuccess({
                    name: finalName,
                    roleId: finalRoleId,
                    token: finalToken
                });

                toast.success(`ברוך הבא, ${finalName}`);

            } else {
                toast.error(userData?.msg || "פרטי התחברות שגויים");
            }
        } catch (err) {
            toast.error("שגיאה בתקשורת עם השרת");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
                <div className="bg-slate-50 p-8 text-center border-b border-slate-100">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">כניסה למערכת</h2>
                </div>
                <div className="p-8" dir="rtl">
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="flex flex-col gap-4">
                            <input type="text" placeholder="שם משתמש" value={username} onChange={(e) => setUsername(e.target.value)} className={inputClasses} required autoComplete="username" />
                            <input type="password" placeholder="סיסמה" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClasses} required autoComplete="current-password" />

                            {showDomainSelector && (
                                <div className="space-y-1.5 text-right">
                                    <label className="text-[11px] font-bold text-slate-500 pr-1">בחר דומיין כניסה:</label>
                                    <select value={selectedDomain} onChange={(e) => setSelectedDomain(e.target.value)} className={inputClasses} required>
                                        <option value="">-- בחר דומיין --</option>
                                        {domains.map((domain, idx) => (
                                            <option key={idx} value={domain.value}>{domain.display}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full rounded-xl bg-[#1A365D] py-4 text-lg font-bold text-white shadow-lg disabled:opacity-50 mt-2">
                            {isLoading ? "מתחבר..." : "התחברות למערכת"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};