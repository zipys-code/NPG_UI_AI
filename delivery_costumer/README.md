# הקשחת Apache לאפליקציית NPG UI (`npg-ui-ai`) - מדריך התקנה אצל הלקוח

מסמך זה מרכז את צעדי ההקשחה בצד Apache שבוצעו וגם נבדקו בסביבת הבדיקות, בעקבות דו"ח בדיקות החדירה.
הצעדים נועדו להתבצע **לפי הסדר**. כל שינוי נמצא בקובץ הגדרות אחד חדש, ולכן ביטול הוא מחיקת הקובץ.

> המדריך מתייחס ל-Apache בלבד. אם האפליקציה מותקנת על IIS (`dist-iis`), יש לבצע את המקבילות בהגדרות IIS.
> הפקודות כתובות ל-RHEL / CentOS. הערות ל-Debian / Ubuntu בסוף המסמך.

## מה השינוי מטפל בו

| סעיף בדו"ח | ממצא | מה עושים |
|---|---|---|
| 2.6 | חשיפת גרסת שרת | `ServerTokens Prod`, `ServerSignature Off` |
| 2.8 | Directory Listing | `Options -Indexes` על תיקיית האפליקציה |
| 2.11 | כותרות חסרות | `X-Content-Type-Options: nosniff` |
| 2.14 | XFS / clickjacking | `X-Frame-Options: DENY` + `Content-Security-Policy: frame-ancestors 'self'` |
| 2.17 | TRACE פעיל | `TraceEnable Off` |
| (תפעולי) | רענון (F5) ו-Logout במסך שאינו הראשי מחזירים 404 | `FallbackResource /npg-ui-ai/index.html` (במקום `.htaccess` שמתעלמים ממנו כש-`AllowOverride None`) |

**לא כלול במדריך הזה (ולמה):**
- **2.10 HSTS** (`Strict-Transport-Security`): הכותרת חלה על כל ה-host. אם אפליקציות אחרות על אותו שרת עדיין עובדות ב-HTTP, היא תשבור אותן. להוסיף רק אחרי שכל האפליקציות על השרת עובדות ב-HTTPS עם תעודה תקפה.
- **CSP מלא:** ממשק המסכים משתמש בסגנונות inline, ו-CSP מלא עלול לשבור אותו. מוגדר רק `frame-ancestors`.
- **2.7, 2.9 עוגיות** (`SameSite`, `Secure`): האפליקציה החדשה לא יוצרת עוגיית סשן. אם בדיקה אצלכם מראה `Set-Cookie`, יש להוסיף `Header edit Set-Cookie ^(.*)$ "$1; Secure; SameSite=Strict"` אחרי שהעבודה ב-HTTPS.
- **2.12, 2.13 HTTPS:** נדרשת תעודה והגדרת VirtualHost על 443 (ראו את מדריך ההתקנה של HTTPS).
- **2.15 רכיבים ישנים:** עדכון חבילות `httpd` (`dnf update httpd`) בחלון תחזוקה.
- **2.16 קונסולת TIBCO Administrator (פורט 8080):** חסימה ב-firewall או העברה לרשת ניהול. לא קשור ל-Apache.
- **2.1 עד 2.5** נוגעים ל-TIBCO ולקוד המסכים ולא ל-Apache.

## קבצים בתיקייה

| קובץ | תפקיד |
|---|---|
| `npg-ui-ai-hardening.conf` | קובץ ההגדרות להעתקה ל-Apache |
| `verify-apache-hardening.sh` | סקריפט בדיקה לקריאה בלבד, להרצה לפני ואחרי |

## צעד 0: תנאים מקדימים

1. גישת `sudo` על שרת ה-Apache.
2. `mod_headers` טעון:

```bash
sudo httpd -M 2>/dev/null | grep headers_module
```

   אם אין פלט, יש להפעיל את המודול (ב-RHEL הוא נטען כברירת מחדל מ-`conf.modules.d`).
3. לדעת איפה נמצאים קבצי האפליקציה (ברירת מחדל `/var/www/html/npg-ui-ai`) ואיזה URL היא משרתת. אם הנתיב שונה, צריך לערוך את הקובץ `npg-ui-ai-hardening.conf` בשני מקומות (`<Directory>` ו-`<LocationMatch>`).
4. כתובת ה-URL של האפליקציה ושל ה-API. הקובץ מניח ש-`/api/` הוא ה-proxy ל-TIBCO.

## צעד 1: בדיקת מצב לפני השינוי

מהמחשב שלכם (לא מהשרת) או מכל מחשב עם גישה:

```bash
./verify-apache-hardening.sh https://<SERVER_NAME>
```

אם יש אפליקציה נוספת על אותו שרת שצריך לוודא שלא נפגעה (למשל `/npg-ui`), הוסיפו אותה כארגומנט שלישי:

```bash
./verify-apache-hardening.sh https://<SERVER_NAME> /npg-ui-ai /npg-ui
```

עם תעודה עצמית (self-signed) הוסיפו `INSECURE=1` בתחילת הפקודה. לפני השינוי צפויות שורות `FAIL`. שמרו את הפלט להשוואה.

## צעד 2: גיבוי

```bash
sudo cp -a /etc/httpd /etc/httpd.bak_$(date +%Y%m%d_%H%M)
```

## צעד 3: העתקת קובץ ההגדרות

```bash
sudo cp npg-ui-ai-hardening.conf /etc/httpd/conf.d/npg-ui-ai-hardening.conf
```

אם הנתיב של האפליקציה אצלכם שונה, ערכו קודם את הקובץ (ראו צעד 0, סעיף 3).

## צעד 4: בדיקת תחביר (בלי לטעון)

```bash
sudo apachectl configtest
```

חייב להופיע `Syntax OK`. אזהרות על מודולים שכבר נטענו (`AH01574`) אינן קשורות לשינוי. אם יש שגיאה, **אין להמשיך**: מחקו את הקובץ שהועתק (ראו "ביטול") ובדקו את ההודעה.

## צעד 5: טעינה (reload, לא restart)

`reload` טוען את ההגדרות בלי לנתק חיבורים פעילים:

```bash
sudo systemctl reload httpd
sudo systemctl status httpd --no-pager | head -8
```

המצב הצפוי: `active (running)`.

## צעד 6: בדיקה אחרי השינוי

```bash
./verify-apache-hardening.sh https://<SERVER_NAME> /npg-ui-ai /npg-ui
```

כל השורות צריכות להיות `PASS`. בנוסף, יש להיכנס לאפליקציה בדפדפן, להתחבר ולפתוח כמה מסכים, כדי לוודא שהממשק עובד כרגיל.

בדיקה ידנית של הכותרות:

```bash
curl -sI https://<SERVER_NAME>/npg-ui-ai/ | grep -i -E "^(Server|X-|Content-Security)"
curl -s -o /dev/null -w "TRACE: %{http_code}\n" -X TRACE https://<SERVER_NAME>/npg-ui-ai/
```

## ביטול (אם משהו לא עובד)

```bash
sudo rm /etc/httpd/conf.d/npg-ui-ai-hardening.conf
sudo systemctl reload httpd
```

## מה שחשוב לדעת

- `ServerTokens`, `ServerSignature` ו-`TraceEnable` הם הגדרות של **כל השרת**. הן מסתירות מידע ומבטלות מתודה שאין בה שימוש רגיל, ולכן אינן משנות התנהגות של אפליקציות אחרות.
- `Options -Indexes`, `X-Frame-Options`, `nosniff` ו-`frame-ancestors` מוגדרים **רק** על `/npg-ui-ai` ועל `/api`. אפליקציות אחרות על אותו שרת לא מושפעות.
- **רענון ו-Logout (404):** האפליקציה היא Single Page App, והכתובות כמו `/npg-ui-ai/view-processes` אינן קבצים אמיתיים. ללא `FallbackResource` (או `.htaccess` פעיל), רענון הדף או כפתור היציאה במסך שאינו הראשי יחזירו 404. ה-`.htaccess` שבחבילה פועל רק כש-`AllowOverride` אינו `None` על תיקיית האפליקציה. בקובץ ההגדרות כאן הפתרון מוגדר ישירות, ולכן אין תלות ב-`AllowOverride`.
- `X-Frame-Options: DENY` מונע הצגת האפליקציה בתוך iframe. אם אתם מטמיעים אותה בדף אחר בכוונה, יש להחליף ל-`SAMEORIGIN` ולעדכן את `frame-ancestors`.
- אם יש תיקיות נוספות מחוץ ל-`npg-ui-ai` שמציגות Directory Listing (למשל אפליקציה ישנה), הן לא נכללות במדריך. יש להחליט עליהן בנפרד, אחרי בדיקה שהאפליקציה אינה תלויה ברשימת הקבצים.
- גיבויים של האפליקציה (למשל `npg-ui-ai.bak_*`) אסור להשאיר בתוך `DocumentRoot`.

## Debian / Ubuntu

- התיקייה היא `/etc/apache2` והשירות `apache2`.
- הפעלת המודול: `sudo a2enmod headers`.
- שימו את הקובץ ב-`/etc/apache2/conf-available/npg-ui-ai-hardening.conf` והפעילו עם `sudo a2enconf npg-ui-ai-hardening`.
- בדיקה וטעינה: `sudo apache2ctl configtest && sudo systemctl reload apache2`.
- ביטול: `sudo a2disconf npg-ui-ai-hardening && sudo systemctl reload apache2`.
