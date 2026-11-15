import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}



/**
 * פונקציה לבדיקת תקינות LRN לפי ה-Pattern הגלובלי
 * @param lrn המחרוזת לבדיקה
 * @returns true אם תקין, false אם לא
 */
export const validateLRN = (lrn: string): boolean => {
  if (!lrn) return false;
  return (window as any).APP_CONFIG.LRN_PATTERN.test(lrn);
};

/**
 * פונקציה להשוואת שני תאריכים
 * @param date1 תאריך ראשון (string, number או Date)
 * @param date2 תאריך שני (string, number או Date)
 * @returns 1 אם הראשון גדול מהשני, 0 אחרת
 */
export const compareDates = (
  date1: string | number | Date,
  date2: string | number | Date
): number => {
  const d1 = new Date(date1).getTime();
  const d2 = new Date(date2).getTime();

  // אם אחד התאריכים לא תקין, נחזיר 0
  if (isNaN(d1) || isNaN(d2)) return 0;

  return d1 > d2 ? 1 : 0;
};

// פונקציית עזר להמרה מהפורמט של המסך (ISO) לפורמט טיבקו
// src/utils/formatters.ts

export const formatForTibco = (dateTimeStr: string) => {
  if (!dateTimeStr) return { date: '', time: '' };

  const [datePart, timePart] = dateTimeStr.split('T');
  const [year, month, day] = datePart.split('-');

  return {
    date: `${day}/${month}/${year}`,
    time: timePart || '00:00'
  };
};
/**
 * Absolute URL path of the application's entry page (login).
 * Vite fixes BASE_URL at build time (build:apache -> /npg-ui-ai/, build:iis -> /).
 * In dev the base is "./", which is not a valid absolute path, so use "/".
 * Used instead of reload()/"/" so logout works from any route (e.g. /npg-ui-ai/view-processes).
 */
export const getAppBaseUrl = (): string => {
  const base = import.meta.env.BASE_URL;
  return base === "./" ? "/" : base;
};
