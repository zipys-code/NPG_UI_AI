// src/components/LoginModal.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { apiRequest } from "@/services/api";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";

interface LoginModalProps {
    onSuccess: (userData: any) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onSuccess }) => {
    const navigate = useNavigate();
    const { lovs, setCurrentNetworkId, setCurrentNetworkName } = useApp();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [selectedDomain, setSelectedDomain] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { setCurrentUser } = useApp();

    const inputClasses = "w-full h-[54px] rounded-xl border border-slate-200 bg-slate-50 px-4 text-right font-sans text-base text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all shadow-sm placeholder:text-slate-400";

    const getSafeValue = (obj: any) => {
        if (!obj) return "";
        return typeof obj === 'object' ? obj["$"] : obj;
    };

    const domains = useMemo(() => {
        if (!lovs) return [];

        const lovsAny = lovs as any;

        // שליפת המידע מתוך ה-data השטוח שהחזרנו מה-api
        const identityGroup = lovsAny?.selfIdentity;

        // השרת שולח מערך בתוך שדה item
        const items = identityGroup?.item || [];

        const itemsArray = Array.isArray(items) ? items : [items];

        return itemsArray.map(d => ({
            value: getSafeValue(d.value),
            display: getSafeValue(d.displayValue)
        })).filter(d => d.value);
    }, [lovs]);


    const showDomainSelector = domains.length > 1;

    useEffect(() => {
        if (domains.length === 1 && domains[0].value) {
            setSelectedDomain(domains[0].value.toString());
        }
    }, [domains]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (showDomainSelector && !selectedDomain) {
            toast.error("אנא בחר דומיין כניסה");
            return;
        }

        setIsLoading(true);
        const loginData = {
            getIn: {
                USER_NAME: username,
                USER_PASSWORD: password,
                SELF_NETWORK_ID: selectedDomain,
                DOMAIN: selectedDomain
            }
        };

        const response = await apiRequest("/GetLogin", loginData);

        if (response) {
            const selectedDomainObj = domains.find(d => d.value === selectedDomain);
            const networkName = selectedDomainObj ? selectedDomainObj.display : "לא ידוע";

            setCurrentNetworkId(selectedDomain);
            setCurrentNetworkName(networkName);

            const userData = {
                name: getSafeValue(response.fullName) || username,
                roleId: getSafeValue(response.roleID), // שינוי מ-'role' ל-'roleId' כדי להתאים ל-Context
                permissions: { canAddProcess: response.addProcessPermission === 'Y' }
            };

            // 2. הזרקת המשתמש לקונטקסט (הפונקציה שהוספנו ל-useApp)
            setCurrentUser(userData);

            toast.success(`ברוך הבא, ${userData.name}`);
            onSuccess(userData);
            navigate("/");
        }
        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="bg-slate-50 p-8 text-center border-b border-slate-100">
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">כניסה למערכת</h2>
                </div>

                <div className="p-8">
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="flex flex-col gap-4" dir="rtl">
                            <input type="text" placeholder="שם משתמש" value={username} onChange={(e) => setUsername(e.target.value)} className={inputClasses} required />
                            <input type="password" placeholder="סיסמה" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClasses} required />

                            {showDomainSelector && (
                                <div className="space-y-1.5 text-right">
                                    <label className="text-[11px] font-bold text-slate-500 pr-1">בחר דומיין כניסה:</label>
                                    <select
                                        value={selectedDomain}
                                        onChange={(e) => setSelectedDomain(e.target.value)}
                                        className={inputClasses}
                                        required
                                    >
                                        <option value="">-- בחר דומיין --</option>
                                        {domains.map((domain, idx) => (
                                            <option key={idx} value={domain.value}>{domain.display}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                        <button type="submit" disabled={isLoading} className="w-full rounded-xl bg-[#1A365D] py-4 text-lg font-bold text-white shadow-lg hover:bg-[#254a7c] disabled:opacity-50 mt-2">
                            {isLoading ? "מתחבר..." : "התחברות למערכת"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};