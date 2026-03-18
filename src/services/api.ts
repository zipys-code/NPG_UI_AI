// src/services/api.ts

import { APP_CONFIG } from "@/config";
import { toast } from "sonner";
import { GetMenuListResponse } from '../types/menu';
import { GetLOVResponse } from '../types/lov';

/**
 * פונקציה מרכזית לביצוע קריאות API
 * כוללת מנגנון ניקוי ותיקון ל-JSON שבור שמגיע מהשרת
 */
// src/services/api.ts

export const apiRequest = async (endpoint: string, data: any) => {
    try {
        const response = await fetch(`${APP_CONFIG.BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error("שגיאת תקשורת");

        let rawText = await response.text();

        // 1. ניקוי תווים נסתרים (Control Characters)
        let fixedText = rawText.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");

        // 2. טיפול אטומי בסלאשים הפוכים:
        // אנחנו מחליפים את התו \ (שקוד ה-Unicode שלו הוא 92) כשהוא מופיע לפני גרש
        fixedText = fixedText.replace(/\\'/g, "'"); // ניסיון רגיל
        fixedText = fixedText.replace(/\u005C'/g, "'"); // ניסיון לפי קוד יוניקוד של סלאש הפוך

        // 3. תיקון מרכאות כפולות בתוך סוגריים (למקרה של פונקציות JS)
        fixedText = fixedText.replace(/\(([^)]+)\)/g, (match) => {
            return match.replace(/"/g, "'").replace(/\\'/g, "'");
        });

        try {
            const result = JSON.parse(fixedText);

            const responseKey = Object.keys(result)[0];
            const dataResponse = result[responseKey];

            if (dataResponse && dataResponse.Code !== undefined) {
                if (dataResponse.Code !== "1000") return null;
                return dataResponse;
            }
            return result;

        } catch (jsonError: any) {
            const posMatch = jsonError.message.match(/position (\d+)/);
            if (posMatch) {
                const pos = parseInt(posMatch[1]);
                // זה הלוג שיגיד לנו הכל: מה קוד התו במיקום הבעייתי?
                const charAtError = fixedText.charAt(pos - 1);
                console.log(`ERROR at pos ${pos}. Char: "${charAtError}" Code: ${fixedText.charCodeAt(pos - 1)}`);
                console.log("CONTEXT:", fixedText.substring(pos - 20, pos + 20));
            }
            return null;
        }
    } catch (error) {
        return null;
    }
};

/**
 * שליפת תפריט המערכת לפי תפקיד ומזהה רשת
 */
export const fetchMenuList = async (): Promise<GetMenuListResponse | null> => {
    const payload = {
        getIn: {
            roleID: "NPG_ADMINISTRATOR",
            selfNetworkID: APP_CONFIG.DEFAULT_SELFNETWORKID
        }
    };
    return await apiRequest("/GetMenuList", payload);
};

/**
 * שליפת טבלאות קוד (LOVs)
 */
export const fetchLOVs = async (): Promise<GetLOVResponse | null> => {
    const payload = {
        getIn: {
            selfNetworkID: APP_CONFIG.DEFAULT_SELFNETWORKID
        }
    };

    const response = await apiRequest("/getLOV", payload);
    if (!response) return null;

    // לוגיקה לטיפול בקינון כפול של getOut (נפוץ ב-TIBCO)
    let targetData = response?.grp?.getOut;
    while (targetData?.getOut) {
        targetData = targetData.getOut;
    }

    // אם לא מצאנו מבנה data מוכר, נחזיר את התגובה כפי שהיא
    if (!targetData || !targetData.data) {
        return response as GetLOVResponse;
    }

    return {
        grp: {
            getOut: targetData
        }
    } as GetLOVResponse;
};