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

        // ניקוי תווים (הלוגיקה הקיימת שלך)
        let fixedText = rawText.replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
            .replace(/\\'/g, "'")
            .replace(/\x5C'/g, "'");

        try {
            const result = JSON.parse(fixedText);

            // חילוץ המעטפת המרכזית (group או root)
            const wrapped = result.group || result.root || result;

            // חילוץ התוכן הפנימי (LoginResponse או getOut)
            const nested = wrapped.LoginResponse || wrapped.getOut || wrapped;

            // חילוץ הודעת שגיאה/הצלחה בצורה גמישה (תומך במערך או אובייקט)
            const notification = nested.notification?.msg || nested;

            // חילוץ קוד והודעה - תומך ב-Code (גדול) וגם ב-code (קטן)
            const msgCode = Array.isArray(notification)
                ? notification[0]?.code
                : (notification?.Code || notification?.code);

            const msgBody = Array.isArray(notification)
                ? notification[0]?.msgBody
                : (notification?.msg || notification?.msgBody);
            if (msgCode && msgCode.toString() === "9999") {
                // שליחת אירוע לדפדפן שהאפליקציה צריכה רענון
                window.dispatchEvent(new CustomEvent('app:config-changed'));
                // החזרת Promise דחוי כדי שהקומפוננטה לא תמשיך לרוץ
                return null;
            }

            // בדיקת קוד הצלחה
            if (msgCode && msgCode.toString() !== "1000") {
                toast.error(msgBody || "שגיאה בפעולה");
                return null;
            }
            // החזרת ה-wrapped (ה-group/root) כדי שהקומפוננטה תוכל לחלץ את מה שהיא צריכה
            return wrapped;

        } catch (jsonError: any) {
            console.error("JSON Parse Error:", jsonError.message);
            return null;
        }
    } catch (error) {
        console.error("Fetch Error:", error);
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

export const searchProcesses = async (filters: any, networkId: string, token: string) => {
    const from = formatForTibco(filters.fromDateTime);
    const to = formatForTibco(filters.toDateTime);

    const requestBody = {
        getIn: {
            token: token,
            selfNetworkID: networkId,
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
    return await apiRequest("/GetProcesses", requestBody);
};

// src/services/api.ts

export const getProcessManipulation = async (processes: any[], networkId: string, token: string, roleId: string) => {
    const payload = {
        getIn: {
            processIdList: {
                // המבנה שראינו ב-Payload בתמונה שלך
                isCheckedProcesses: processes.map(p => ({
                    processID: p.processID,
                    requestID: p.requestID
                }))
            },
            token: token,
            selfNetworkID: networkId,
            roleID: roleId
        }
    };

    return await apiRequest("/GetProcessManipulation", payload);
};

// עדכון ה-Interface של הפרמטרים שמתקבלים בפונקציה
export const setProcesses = async (params: {
    mode: string;
    processes: { processId: any, requestId: any, processState: any }[];
    targetState?: string;
    groupId?: string;
    selfNetworkId: string;
    roleId: string;
    token?: string;
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
                    processState: p.processState
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


export const setAddProcess = async (formData: any, userName: string, selfNetworkID: string, token: string, roleID: string) => {
    const payload = {

        setIn: {
            user: userName,
            data: {
                singleForm: {
                    // --- חלק 1: מזהים וסטטוסים ---
                    txtProcessID: "",
                    txtRequestID: "",
                    txtRequestGroupID: "",
                    txtProcessStat: "",
                    slctProcessStat: "",

                    // --- חלק 2: סוגי תהליכים ---
                    slctProcessType: formData.slctProcessType,
                    slctDnNetworkType: formData.slctDnNetworkType,
                    slctDnType: formData.slctDnType,

                    // --- חלק 3: מספרי טלפון ---
                    txtDnNum: formData.txtDnNum,
                    txtDnFrom: "",
                    txtdnTo: "",
                    txtDonorLeadingNumber: "",
                    txtRecipentLeadingNumber: "",

                    // --- חלק 4: מפעילים ---
                    slctRecipientNetworkID: selfNetworkID, // מפעיל קולט
                    slctDonorNetworkID: formData.slctDonorNetworkID,    // מפעיל ננטש

                    // --- חלק 5: פרטי לקוח והזמנה (לפי המיפוי הישן) ---
                    txtZipcode: "",
                    txtCrmOrderNum: formData.txtCrmOrderNum,
                    txtCrmCustomerID: formData.txtCrmCustomerID, // זהו ה-SUB_CORRELATION_ID
                    txtBillCustomerID: formData.txtBillCustomerID,
                    txtBillContractID: formData.txtBillContractID, // CRM_CUSTOMER_ID מהישן

                    // --- חלק 6: תאריכים ---
                    txtRequestedPortDate: formData.txtRequestedPortDate,
                    txtRequestedExecDate: formData.txtRequestedExecDate,
                    txtActualPortDate: "",
                    txtActualRouteDate: "",
                    txtStateTypeID: "",
                    txtLastUpdateDate: "",

                    // --- חלק 7: שדות נוספים ומזהים (CustomerID 1,2,3) ---
                    txtTemporaryAttribute_rpar_: formData.txtTemporaryAttribute_rpar_, // PREPAID (N/Y)
                    txtCustomerID1: formData.txtCustomerID1,
                    txtCustomerID1Type: formData.txtCustomerID1Type,
                    txtCustomerID2: formData.txtCustomerID2 || "",
                    txtCustomerID2Type: "9", // ברירת מחדל ת"ז
                    txtCustomerID3: formData.txtCustomerID3 || "",
                    txtCustomerID3Type: "9",

                    // --- חלק 8: זמנים ---
                    txtRequestedPortTime: formData.txtRequestedPortTime,
                    txtRequestedExecTime: formData.txtRequestedExecTime,
                    txtActualPortTime: "",
                    txtActualRouteTime: "",
                    txtLastUpdateTime: "",
                    localInfo: "",
                    txtNewCrmCustomerId: ""
                }
            },
            token: token,
            selfNetworkID: selfNetworkID
        }
    };

    console.log("Sending Corrected JSON:", JSON.stringify(payload));
    return await apiRequest("/SetAddProcess", payload);
};