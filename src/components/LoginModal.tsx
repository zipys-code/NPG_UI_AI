import React, { useState } from 'react';
import { APP_CONFIG } from '@/config';

interface LoginModalProps {
    onSuccess: (userData: { name: string; domain?: string }) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onSuccess }) => {
    const [username, setUsername] = useState('');
    const [domain, setDomain] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (password === '1234' && username.trim() !== '') {
            onSuccess({
                name: username.trim(),
                domain: APP_CONFIG.DOMAIN_REQUIRED === 'Y' ? domain.trim() : undefined
            });
        } else {
            setError(true);
            setPassword('');
        }
    };

    return (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-slate-900/90 backdrop-blur-md p-4">
            <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-300">

                {/* אזור הלוגו והכותרת */}
                <div className="bg-slate-50 p-8 text-center border-b border-slate-100">
                    <div className="flex justify-center mb-6" dir="ltr">
                        <span className="z-30 flex h-14 w-14 items-center justify-center rounded-full bg-[#1A365D] text-lg font-bold text-black shadow-lg">N</span>
                        <span className="z-20 -ml-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#556B2F] text-lg font-bold text-black shadow-lg border border-white/10">P</span>
                        <span className="z-10 -ml-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#A0522D] text-lg font-bold text-black shadow-lg border border-white/10">G</span>
                    </div>

                    <h2 className="text-2xl font-black text-slate-800 tracking-tight">כניסה למערכת</h2>
                    <p className="mt-2 text-slate-500 font-medium text-sm">אנא הזן פרטי משתמש וסיסמה</p>
                </div>

                {/* טופס הכניסה */}
                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex flex-col gap-4" dir="rtl">

                            {/* שדה שם משתמש - תמיד שורה מלאה */}
                            <input
                                type="text"
                                placeholder="שם משתמש"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-right font-bold text-slate-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all shadow-sm"
                                required
                            />

                            {/* שדה דומיין - מופיע בשורה נפרדת רק אם הוגדר ב-Config */}
                            {APP_CONFIG.DOMAIN_REQUIRED === 'Y' && (
                                <input
                                    type="text"
                                    placeholder="Domain"
                                    value={domain}
                                    onChange={(e) => setDomain(e.target.value)}
                                    className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-right font-medium text-slate-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 focus:outline-none transition-all text-sm shadow-sm"
                                />
                            )}

                            {/* שדה סיסמה */}
                            <div className="pt-2">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (error) setError(false);
                                    }}
                                    className={`w-full rounded-xl border p-4 text-center text-xl font-bold tracking-[0.5em] transition-all focus:outline-none shadow-sm ${error
                                        ? "border-red-500 bg-red-50"
                                        : "border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                                        }`}
                                    placeholder="••••"
                                    required
                                />
                                {error && (
                                    <p className="mt-2 text-center text-sm font-bold text-red-500 animate-bounce">
                                        פרטים שגויים, נסה שנית
                                    </p>
                                )}
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="w-full rounded-xl bg-[#1A365D] py-4 text-lg font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] mt-2"
                        >
                            התחברות למערכת
                        </button>
                    </form>

                    <div className="mt-6 text-center text-xs text-slate-400 font-medium">
                        © {new Date().getFullYear()} NPG Portability System | Version 1.0.0
                    </div>
                </div>
            </div>
        </div>
    );
};