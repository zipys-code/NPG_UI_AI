import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { APP_CONFIG } from "@/config"; // ה- @ תמיד מפנה ל-src לא משנה איפה את נמצאת

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
  return APP_CONFIG.LRN_PATTERN.test(lrn);
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