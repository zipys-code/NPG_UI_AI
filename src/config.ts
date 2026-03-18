// src/config.ts

export const APP_CONFIG = {
    // שינוי הכתובת ל-Proxy המקומי כדי לעקוף בעיות CORS
    BASE_URL: "/api",

    DEFAULT_SELFNETWORKID: '320',

    // קבועים לוגיים (Patterns)
    LRN_PATTERN: /^[D]\d{3}$/,

    // הגדרות גלובליות
    APP_NAME: "מערכת ניוד מספרים NPG",
    VERSION: "21.08.73",
    LOGIN_REQUIRED: "Y",
    SESSION_DURATION_MINUTES: 120, // שעתיים
};