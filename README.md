# NPG – Number Portability Gateway UI

ממשק ניהול (עברית, RTL) למערכת ניוד מספרים ארצית. אפליקציית צד-לקוח (SPA) שמתקשרת עם שרת TIBCO דרך פרוקסי `/api`.

## טכנולוגיות
Vite, React 18, TypeScript, Tailwind CSS, shadcn/ui, MUI, React Router, TanStack Query.

## הרצה מקומית
דרישות: Node.js ו-npm.

```sh
npm install
npm run dev
```

שרת הפיתוח עולה על פורט 8081 ומפנה `/api/*` אל `http://localhost:8085`.

## פקודות
| פקודה | תיאור |
|---|---|
| `npm run lint` | בדיקת ESLint |
| `npm test` | בדיקות (vitest) |
| `npm run build` | build רגיל ל-`dist/` |
| `npm run build:iis` | build ל-IIS ב-`dist-iis/` |
| `npm run build:apache` | build ל-Apache ב-`dist-apache/` (base `/npg-ui-ai/`) |

## קונפיגורציה
הגדרות לפי סביבה נמצאות ב-`public/config.js` (`window.APP_CONFIG`) ונטענות בזמן ריצה, ללא build מחדש: כתובת ה-API, חובת התחברות, מזהה רשת ברירת מחדל, משך סשן ועוד.
לפריסה על Apache יש לשלב את `tibco-proxy-ai.conf` (ProxyPass ל-`/api/`).

מידע נוסף למפתחים ול-Claude: [CLAUDE.md](CLAUDE.md).
