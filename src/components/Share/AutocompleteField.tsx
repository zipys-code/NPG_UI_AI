import React, { useState, useRef, useEffect } from 'react';

export const AutocompleteField = ({ label, options, value, onChange, placeholder = "-בחר-", hasError = false }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef<HTMLDivElement>(null);

    // שליפת התווית להצגה - תומך גם במבנה החדש של lovs
    const currentLabel = options.find((opt: any) => opt.value === value)?.label || '';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) setIsOpen(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="flex items-center gap-3 h-7 relative w-full" ref={wrapperRef}>
            {/* רינדור מותנה של הלייבל - אם הוא ריק, הוא לא קיים ב-DOM בכלל */}
            {label && label.trim() !== "" && (
                <label className="text-[11px] font-bold text-slate-600 w-28 text-right shrink-0">
                    {label}
                </label>
            )}

            {/* מכולה שחייבת להיות ברוחב מלא */}
            <div className="flex-1 relative w-full" style={{ width: '100%' }}>
                <input
                    type="text"
                    className={`!w-full rounded border px-2 py-1 text-[11px] outline-none h-7 shadow-sm text-right transition-all ${hasError
                            ? 'border-red-500 bg-red-50 ring-1 ring-red-200'
                            : 'border-slate-300 bg-white focus:border-blue-500'
                        }`}
                    placeholder={currentLabel || placeholder}
                    value={isOpen ? searchTerm : currentLabel}
                    onFocus={() => { setIsOpen(true); setSearchTerm(''); }}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: '100%' }} // וידוא נוסף דרך Style
                />

                {isOpen && (
                    <div className="absolute top-full right-0 left-0 z-[110] mt-1 max-h-40 overflow-y-auto rounded border border-slate-200 bg-white shadow-lg text-right">
                        <div
                            className="px-2 py-1 text-[11px] hover:bg-blue-50 cursor-pointer text-slate-400"
                            onClick={() => { onChange(''); setIsOpen(false); }}
                        >
                            -ללא-
                        </div>
                        {options
                            .filter((o: any) => (o.label || '').toLowerCase().includes(searchTerm.toLowerCase()))
                            .map((opt: any) => (
                                <div
                                    key={opt.value}
                                    className="px-2 py-1 text-[11px] hover:bg-blue-50 cursor-pointer text-slate-700 border-b border-slate-50 last:border-0"
                                    onClick={() => { onChange(opt.value); setIsOpen(false); }}
                                >
                                    {opt.label}
                                </div>
                            ))
                        }
                    </div>
                )}
            </div>
        </div>
    );
};