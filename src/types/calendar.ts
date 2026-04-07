// src/types/calendar.ts

export interface CalendarResponse {
    root: {
        getOut: {
            notification: {
                msg: Array<{
                    code: string;
                    severity: string;
                    msgBody: string;
                }>;
            };
            data: {
                systemCalendar: { rowSC: any[] };
                weeklySchedule: { rowWS: any[] };
                calendarException: { rowCE: any[] };
            };
        };
    };
}