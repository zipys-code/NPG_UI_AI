// src/config.ts

export const APP_CONFIG = {
    // שינוי הכתובת ל-Proxy המקומי כדי לעקוף בעיות CORS
    BASE_URL: "/api",

    DEFAULT_SELFNETWORKID: '316',

    // קבועים לוגיים (Patterns)
    LRN_PATTERN: /^[D]\d{3}$/,

    // הגדרות גלובליות
    APP_NAME: "מערכת ניוד מספרים NPG",
    VERSION: "1.0.0",
    LOGIN_REQUIRED: "Y",
    DOMAIN_REQUIRED: "N",
    DEFAULT_DOMAIN: "",
    SESSION_DURATION_MINUTES: 120, // שעתיים
};