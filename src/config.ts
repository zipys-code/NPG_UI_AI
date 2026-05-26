// src/config.ts

export const APP_CONFIG = {
    // שינוי הכתובת ל-Proxy המקומי כדי לעקוף בעיות CORS
    BASE_URL: "/api",

    // קבועים לוגיים (Patterns)
    LRN_PATTERN: /^[D]\d{3}$/,

    // הגדרות גלובליות
    APP_NAME: "מערכת ניוד מספרים NPG",
    VERSION: "21.08.73",
    LOGIN_REQUIRED: "Y",
    // default token NO LOGIN = NPDUMMY_ + timestamp - need to be dynamic to prevent caching issues
    SESSION_DURATION_MINUTES: 120, // שעתיים

    // הגדרות נוספות לפי הצורך
    DEFAULT_SELFNETWORKID: "322",
    ROLE_ID: "NPG_ADMINISTRATOR",
    DEFAULT_USERNAME: "אורח"
};