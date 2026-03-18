// src/components/LoginModal.tsx

import React, { useState, useEffect, useMemo } from 'react';
import { APP_CONFIG } from '@/config';
import { apiRequest } from "@/services/api";
import { toast } from "sonner";
import { useApp } from "@/context/AppContext";

interface LoginModalProps {
    onSuccess: (userData: any) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onSuccess }) => {
    const { lovs, setCurrentNetworkId } = useApp();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [selectedDomain, setSelectedDomain] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // קלאס משותף לכל השדות להבטחת אחידות מושלמת
    const inputClasses = "w-full h-[54px] rounded-xl border border-slate-200 bg-slate-50 px-4 text-right font-sans text-base text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all shadow-sm placeholder:text-slate-400";

    // חילוץ דומיינים (מזהי רשת) בצורה חסינה
    const domains = useMemo(() => {
        const item = lovs?.grp?.getOut?.data?.selfIdentity?.["value.options"]?.item;
        if (!item) return [];
        return Array.isArray(item) ? item : [item];
    }, [lovs]);

    const showDomainSelector = domains.length > 1;

    useEffect(() => {
        // אם יש רק דומיין אחד, נבחר אותו אוטומטית כברירת מחדל
        if (domains.length === 1 && domains[0].value?.["$"]) {
            setSelectedDomain(domains[0].value["$"].toString());
        }
    }, [domains]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const loginData = {
            USER_NAME: username,
            USER_PASSWORD: password,
            SELF_NETWORK_ID: selectedDomain, // מזהה הרשת הנבחר
            DOMAIN: selectedDomain           // כפול גם לכאן לפי הדרישה
        };

        const response = await apiRequest("/GetLogin", loginData);

        if (response) {
            // שמירת המזהה שנבחר במשתנה האפליקציה הגלובלי (ב-Context)
            setCurrentNetworkId(selectedDomain);

            const userData = {
                name: response.fullName,
                role: response.roleID,
                permissions: { canAddProcess: response.addProcessPermission === 'Y' }
            };

            toast.success(`ברוך הבא, ${response.fullName}`);
            onSuccess(userData);
        }
        setIsLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-300">
                <div className="bg-slate-50 p-8 text-center border-b border-slate-100">
                    <div className="flex justify-center mb-6" dir="ltr">
                        <span className="z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#1A365D] text-lg font-bold text-white shadow-lg">N</span>
                        <span className="z-20 -ml-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#556B2F] text-lg font-bold text-white shadow-lg">P</span>
                        <span className="z-10 -ml-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#A0522D] text-lg font-bold text-white shadow-lg">G</span>
                    </div>
                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">כניסה למערכת</h2>
                    <p className="mt-2 text-slate-500 font-medium text-sm">אנא הזן פרטי משתמש וסיסמה</p>
                </div>

                <div className="p-8">
                    <form onSubmit={handleLogin} className="space-y-5">
                        <div className="flex flex-col gap-4" dir="rtl">
                            {/* שם משתמש */}
                            <input
                                type="text"
                                placeholder="שם משתמש"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className={inputClasses}
                                required
                            />

                            {/* סיסמה */}
                            <input
                                type="password"
                                placeholder="סיסמה"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={inputClasses}
                                required
                            />

                            {/* בחירת דומיין - מוצג רק אם יש יותר מאחד */}
                            {showDomainSelector && (
                                <div className="space-y-1.5 text-right">
                                    <label className="text-[11px] font-bold text-slate-500 pr-1">בחר דומיין כניסה:</label>
                                    <div className="relative">
                                        <select
                                            value={selectedDomain}
                                            onChange={(e) => setSelectedDomain(e.target.value)}
                                            className={`${inputClasses} appearance-none cursor-pointer pr-4 pl-10`}
                                            style={{
                                                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b' stroke-width='2'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'/%3E%3C/svg%3E")`,
                                                backgroundRepeat: 'no-repeat',
                                                backgroundPosition: 'left 12px center',
                                                backgroundSize: '16px'
                                            }}
                                            required
                                        >
                                            <option value="" disabled className="text-slate-400">-- בחר דומיין --</option>
                                            {domains.map((domain, idx) => (
                                                <option key={idx} value={domain.value?.["$"]?.toString()} className="text-slate-700">
                                                    {domain.displayValue?.["$"]}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full rounded-xl bg-[#1A365D] py-4 text-lg font-bold text-white shadow-lg transition-all hover:bg-[#254a7c] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 mt-2"
                        >
                            {isLoading ? "מתחבר..." : "התחבורת למערכת"}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-[11px] text-slate-400 font-medium">
                        © {new Date().getFullYear()} NPG Portability System | Version {APP_CONFIG.VERSION}
                    </div>
                </div>
            </div>
        </div>
    );
};