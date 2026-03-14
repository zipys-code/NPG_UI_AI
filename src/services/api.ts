import { APP_CONFIG } from "@/config";
import { toast } from "sonner"; // אנחנו משתמשים ב-Sonner להודעות צפות

export const apiRequest = async (endpoint: string, data: any) => {
    try {
        const response = await fetch(`${APP_CONFIG.BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error("שגיאת תקשורת עם השרת");

        const result = await response.json();

        // חוק הברזל: בדיקת קוד 1000
        // נניח שהמבנה תמיד עוטף את התשובה באובייקט (כמו LoginResponse)
        const responseKey = Object.keys(result)[0];
        const dataResponse = result[responseKey];

        if (dataResponse.Code !== "1000") {
            // הצגת הודעת שגיאה עם הגדרות ספציפיות
            toast.error(dataResponse.msg || "אירעה שגיאה בשרת", {
                duration: 10000, // 10 שניות - מספיק זמן לקרוא ולהגיב
                style: {
                    background: '#FEF2F2',
                    color: '#991B1B',
                    border: '1px solid #F87171',
                },
            });
            return null;
        }

        return dataResponse;
    } catch (error) {
        toast.error("לא ניתן להתחבר לשרת. ודא שהשרת פעיל.");
        return null;
    }
};