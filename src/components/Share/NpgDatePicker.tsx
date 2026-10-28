import React, { forwardRef, useMemo } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { he } from 'date-fns/locale/he';
import { format, isValid } from 'date-fns';
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon, Clock } from 'lucide-react';

registerLocale('he', he);

interface NpgDatePickerProps {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    showTime?: boolean;
    showDate?: boolean; // התוספת החדשה!
    error?: string;
    disabled?: boolean;
}

export const NpgDatePicker = ({
    label,
    value,
    onChange,
    showTime = false,
    showDate = true, // ברירת המחדל היא להציג תאריך
    error,
    disabled = false
}: NpgDatePickerProps) => {

    const parsedDate = useMemo(() => {
        if (!value) return null;
        const normalized = value.replace(' ', 'T');
        const d = new Date(normalized);
        return isValid(d) ? d : null;
    }, [value]);

    const handleDateChange = (date: Date | null) => {
        if (!date) {
            onChange("");
            return;
        }
        const timePart = value && value.includes('T') ? value.split('T')[1].substring(0, 5) : '00:00';
        const datePart = format(date, "yyyy-MM-dd");
        onChange(showTime ? `${datePart}T${timePart}` : datePart);
    };

    const handleTimeChange = (date: Date | null) => {
        if (!date) return;
        const datePart = value && value.includes('T') ? value.split('T')[0] : format(new Date(), "yyyy-MM-dd");
        const timePart = format(date, "HH:mm");
        onChange(`${datePart}T${timePart}`);
    };

    const errorClass = error && error !== " " ? "border-red-400 bg-red-50" : "border-slate-300 focus:border-blue-500 bg-white";
    const disabledClass = disabled ? "bg-slate-100 cursor-not-allowed opacity-70" : "";

    const CustomInput = forwardRef(({ value, onClick, onChange, onBlur, onKeyDown, className, placeholder, icon: Icon }: any, ref: any) => (
        <div className="relative w-full" onClick={onClick}>
            <input
                ref={ref}
                value={value}
                onChange={onChange}
                onBlur={onBlur}
                onKeyDown={onKeyDown}
                placeholder={placeholder}
                disabled={disabled}
                dir="ltr"
                className={`w-full border rounded pr-8 pl-2 py-1 h-8 text-xs outline-none transition-all shadow-sm text-right text-slate-700 cursor-text focus:border-blue-500 ${errorClass} ${disabledClass} ${className}`}
            />
            {Icon && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                    <Icon size={14} />
                </div>
            )}
        </div>
    ));

    const renderCustomHeader = ({ date, decreaseMonth, increaseMonth, prevMonthButtonDisabled, nextMonthButtonDisabled }: any) => (
        <div className="flex items-center justify-between px-2 py-2 bg-slate-50 border-b border-slate-200">
            <button onClick={decreaseMonth} disabled={prevMonthButtonDisabled} type="button" className="p-1 hover:bg-slate-200 rounded text-slate-600">
                <ChevronRight size={16} />
            </button>
            <span className="text-[13px] font-bold text-slate-700">
                {format(date, "MMMM yyyy", { locale: he })}
            </span>
            <button onClick={increaseMonth} disabled={nextMonthButtonDisabled} type="button" className="p-1 hover:bg-slate-200 rounded text-slate-600">
                <ChevronLeft size={16} />
            </button>
        </div>
    );

    return (
        <div className="flex flex-col w-full" dir="rtl">
            {label && (
                <label className="text-xs font-bold text-slate-500 pr-1 mb-1.5">
                    {label}
                </label>
            )}

            <div className="flex gap-2 w-full">
                {/* שדה תאריך מרונדר רק אם showDate=true */}
                {showDate && (
                    <div className="w-full">
                        <DatePicker
                            selected={parsedDate}
                            onChange={handleDateChange}
                            locale="he"
                            dateFormat="dd/MM/yyyy"
                            customInput={<CustomInput icon={CalendarIcon} placeholder="DD/MM/YYYY" />}
                            renderCustomHeader={renderCustomHeader}
                            popperClassName="!z-[9999]"
                            fixedHeight
                        />
                    </div>
                )}

                {/* שדה שעה - אם אין תאריך, הוא מתרחב לכל הרוחב! */}
                {showTime && (
                    <div className={showDate ? "w-[85px] shrink-0" : "w-full"}>
                        <DatePicker
                            selected={parsedDate}
                            onChange={handleTimeChange}
                            showTimeSelect
                            showTimeSelectOnly
                            timeIntervals={1}
                            timeCaption="שעה"
                            dateFormat="HH:mm"
                            timeFormat="HH:mm"
                            customInput={<CustomInput icon={Clock} placeholder="00:00" className="text-center" />}
                            popperClassName="!z-[9999]"
                        />
                    </div>
                )}
            </div>

            {error && error !== " " && (
                <span className="text-[10px] text-red-600 font-semibold pr-1 mt-1">
                    {error}
                </span>
            )}
        </div>
    );
};