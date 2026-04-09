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


export const setAddProcess = async (formData: any, appContext: any) => {
    const payload = {

        setIn: {
            user: appContext.currentUser?.name || "testuser",
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
                    slctRecipientNetworkID: appContext.currentNetworkId, // מפעיל קולט
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
            token: "",
            selfNetworkID: appContext.currentNetworkId
        }
    };

    console.log("Sending Corrected JSON:", JSON.stringify(payload));
    return await apiRequest("/SetAddProcess", payload);
};