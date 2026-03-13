export const APP_CONFIG = {
    // נלקח מה-.env
    SERVER_URL: import.meta.env.VITE_NPG_SERVER_URL || 'http://localhost:3000',
    DEFAULT_SELFNETWORKID: import.meta.env.VITE_DEFAULT_SELFNETWORKID || '316',

    // קבועים לוגיים (Patterns)
    LRN_PATTERN: /^[D]\d{3}$/, // הפכתי את זה ל-Regex אמיתי לשימוש קל

    // אפשר להוסיף כאן עוד הגדרות גלובליות
    APP_NAME: "מערכת ניוד מספרים NPG",
    VERSION: "1.0.0",
    LOGIN_REQUIRED: "Y",
    DOMAIN_REQUIRED: "N", // האם שדה הדומיין חובה במודאל
};