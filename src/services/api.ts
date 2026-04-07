import { APP_CONFIG } from "@/config";
import { toast } from "sonner";
import { GetMenuListResponse } from '../types/menu';
import { GetLOVResponse } from '../types/lov';
import { formatForTibco } from '../lib/utils';

export const apiRequest = async (endpoint: string, data: any) => {
    try {
        const response = await fetch(`${APP_CONFIG.BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        if (!response.ok) throw new Error("שגיאת תקשורת");

        let rawText = await response.text();

        // 1. ניקוי תווים נסתרים
        let fixedText = rawText.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");

        // 2. פתרון סופי לתו 92 (סלאש הפוך):
        // אנחנו משתמשים ב-Regex שמחפש את התו \ באופן מפורש ומחליף אותו בכלום אם הוא לפני גרש
        fixedText = fixedText.replace(/\\'/g, "'");
        fixedText = fixedText.replace(/\x5C'/g, "'"); // \x5C הוא קוד הקסדצימלי ל-92

        // 3. תיקון מרכאות כפולות בתוך סוגריים
        fixedText = fixedText.replace(/\(([^)]+)\)/g, (match) => {
            return match.split('"').join("'");
        });

        // 4. ניסיון ניקוי אחרון לכל סלאש שנשאר "תקוע" בתוך מחרוזת
        // זה יחליף כל סלאש שמופיע לפני תו עברי או גרש
        fixedText = fixedText.replace(/\\(?=['\u0590-\u05FF])/g, "");

        /* try {
            const result = JSON.parse(fixedText);

            const responseKey = Object.keys(result)[0];
            const dataResponse = result[responseKey];
            const nestedResponse = dataResponse?.LoginResponse || dataResponse;

            if (nestedResponse?.Code && nestedResponse.Code.toString() !== "1000") {
                toast.error(nestedResponse.msg || "שגיאה בפרטי ההתחברות");
                return null;
            }

            return nestedResponse || result;

        }  */
        try {
            const result = JSON.parse(fixedText);

            // 1. בדיקה עבור מבנה תהליכים (החדש)
            if (result.root?.getOut) {
                const getOut = result.root.getOut;
                const notification = getOut.notification?.msg;

                // חילוץ הקוד - תומך גם אם זה מערך וגם אם זה אובייקט (לפי הצילום שלך זה מערך)
                const msgCode = Array.isArray(notification) ? notification[0]?.code : notification?.code;

                if (msgCode && msgCode.toString() !== "1000") {
                    const msgBody = Array.isArray(notification) ? notification[0]?.msgBody : notification?.msgBody;
                    toast.error(msgBody || "שגיאה בטעינת נתונים");
                    return null;
                }

                // מחזירים את האובייקט המלא כדי שהקומפוננטה תוכל לחלץ את הנתונים
                return result;
            }

            // 2. לוגיקה מקורית (עבור Login ומסכים אחרים)
            const responseKey = Object.keys(result)[0];
            const dataResponse = result[responseKey];
            const nestedResponse = dataResponse?.LoginResponse || dataResponse;

            if (nestedResponse?.Code && nestedResponse.Code.toString() !== "1000") {
                toast.error(nestedResponse.msg || "שגיאה בפרטי ההתחברות");
                return null;
            }

            return nestedResponse || result;

        }
        catch (jsonError: any) {
            const posMatch = jsonError.message.match(/position (\d+)/);
            if (posMatch) {
                const pos = parseInt(posMatch[1]);
                console.log("CHAR CODE AT ERROR:", fixedText.charCodeAt(pos - 1));
                console.log("TEXT AROUND ERROR:", fixedText.substring(pos - 15, pos + 15));
            }
            return null;
        }
    } catch (error) {
        return null;
    }
};

export const fetchMenuList = async (): Promise<GetMenuListResponse | null> => {
    const payload = {
        getIn: {
            roleID: "NPG_ADMINISTRATOR",
            selfNetworkID: APP_CONFIG.DEFAULT_SELFNETWORKID
        }
    };
    return await apiRequest("/GetMenuList", payload);
};

export const fetchLOVs = async (): Promise<GetLOVResponse | null> => {
    const payload = {
        getIn: { selfNetworkID: APP_CONFIG.DEFAULT_SELFNETWORKID }
    };

    const response = await apiRequest("/getLOV", payload);
    return response?.data || null;
};

/// פונקציית עזר להמרת תאריך מ-YYYY-MM-DDTHH:mm לפורמט ישראלי ושעה
const parseDateTime = (dateTimeStr: string) => {
    if (!dateTimeStr) return { date: '', time: '' };
    const [datePart, timePart] = dateTimeStr.split('T');
    const [y, m, d] = datePart.split('-');
    return {
        date: `${d}/${m}/${y}`,
        time: timePart || '00:00'
    };
};

// src/services/api.ts

export const searchProcesses = async (filters: any, networkId: string | null) => {
    const from = formatForTibco(filters.fromDateTime);
    const to = formatForTibco(filters.toDateTime);

    const requestBody = {
        getIn: {
            token: "",
            selfNetworkID: networkId || "320",
            filters: {
                requestId: filters.requestId,
                processId: filters.processId, // שדה חדש
                groupId: filters.groupId,
                customerId: filters.customerId,
                fromDate: from.date,
                fromTime: from.time,
                toDate: to.date,
                toTime: to.time,
                donorLeadingNumber: filters.mobileAband,
                receiverLeadingNumber: filters.mobileRec,
                operatorSelected: filters.filterByOp,
                networkSelected: filters.filterByNet,
                processType: filters.processType,
                processStatus: filters.processStatus,
                processStep: filters.processStep,
                customerProfile: filters.customerProfile,
                dnType: filters.filterByNum === "RANGE" ? "Range" : (filters.filterByNum === "SINGLE" ? "Single" : ""),

                // תיקון: fromNumber נשלח רק אם יש סינון מספר/טווח. mobileRec נשאר עצמאי.
                fromNumber: (filters.filterByNum === "RANGE" || filters.filterByNum === "SINGLE") ? filters.mobileStart : "",
                toNumber: filters.filterByNum === "RANGE" ? filters.mobileRecEnd : ""
            }
        }
    };

    console.log("Sending JSON Request:", requestBody);
    return await apiRequest("/GetProcesses", requestBody);
};

// src/services/api.ts

export const getProcessManipulation = async (selectedProcessIds: string[], networkId: string | null) => {
    const payload = {
        getIn: {
            processIdList: {
                isCheckedProcesses: selectedProcessIds.map(id => ({
                    processID: id
                }))
            },
            token: "",
            selfNetworkID: networkId || "320",
            roleID: "NPG_ADMINISTRATOR"
        }
    };

    return await apiRequest("/GetProcessManipulation", payload);
};

// עדכון ה-Interface של הפרמטרים שמתקבלים בפונקציה
export const setProcesses = async (params: {
    mode: string;
    processes: { processId: any, requestId: any }[];
    targetState?: string;
    groupId?: string;
    selfNetworkId: string;
    roleId: string;
    userName: string;
    portingData?: any;
    republishList?: string;
}) => {
    const payload = {
        setIn: {
            user: params.userName,
            selfNetworkId: params.selfNetworkId,
            roleId: params.roleId,
            mode: params.mode,
            checkedProcessList: {
                // המרת המערך שלנו למבנה של ה-Mapper
                processList: params.processes.map(p => ({
                    processID: p.processId,
                    requestID: p.requestId,
                    processState: "" // אופציונלי לפי הצילום
                }))
            },
            targetState: params.targetState || "",
            groupId: params.groupId || "",
            republishList: params.republishList || "",
            portingData: params.portingData || null
        }
    };

    return await apiRequest("/SetProcesses", payload);
};

// services/api.ts

export const setAddProcess = async (params: any) => {
    const payload = {
        TOKEN: "dummy_token", // או window.token אם יש
        SELF_NETWORK_ID: params.selfNetworkId,
        USER: params.userName,
        PROCESS_TYPE: params.processType,
        DN_NUMBER: params.dnNumber,
        CRM_ORDER_NUM: params.crmOrderNum,
        CRM_CUSTOMER_ID: params.contractId, // זה "מספר חוזה בילינג" מהקוד הישן
        BILL_CUSTOMER_ID: params.billCustomerId,
        REQUESTED_PORT_DATE: params.portedDate,
        REQUESTED_PORT_TIME: params.portedTime,
        REQUESTED_EXEC_DATE: params.execDate,
        REQUESTED_EXEC_TIME: params.execTime,
        CUSTOMER_ID1: params.customerId1,
        CUSTOMER_ID2: params.customerId2,
        CUSTOMER_ID3: params.customerId3,
        SUB_CORRELATION_ID: params.crmCustomerId, // מזהה לקוח CRM
        PREPAID: params.prepaid,
        NETWORK_TYPE: params.networkType,
        CUSTOMER_PROFILE: params.customerProfile,
        ACTIVATION_TYPE: params.activationType,
        DONOR: params.newDonor
    };

    return await apiRequest("SetAddProcess", payload);
};