import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Cog,
  FileText,
  Settings,
  Table2,
  User,
  Wrench,
  LogOut
} from "lucide-react";

const menuItems = [
  {
    label: "הגדרות",
    icon: Settings,
    dropdownItems: [
      "טבלאות קוד",
      "הגדרות יומן",
      "הגדרות מפעיל",
      "הגדרות ממשק",
      "הגדרות תבנית אירוע",
      "הגדרות מקור אירוע",
      "הגדרות תפעול תהליך",
      "ניהול הרשאות",
    ],
  },
  {
    label: "תפעול",
    icon: Wrench,
    dropdownItems: [
      "צפייה באירועים",
      "צפייה במסרים",
      "צפייה בתהליכים",
      "ניהול תהליכים",
    ],
  },
  {
    label: "תחזוקה",
    icon: Cog,
    dropdownItems: [
      "סנכרון פנימי",
      "סנכרון בין מפעילים",
      "ניהול מפעילים",
      "שאילתת מספר",
      "בריאות מערכת",
      "לוח בקרה ראשית",
      "תיזמון משימות",
      "לוח בקרה עיסקי",
    ],
  },
  {
    label: "טבלאות ניוד",
    icon: Table2,
    dropdownItems: ["תכנית מספר ארצית", "נתוני ניוד"],
  },
  {
    label: "דוחות",
    icon: FileText,
    dropdownItems: ["מחולל דוחות"],
  },
];

const operators = ["הוט מובייל", "פרטנר", "סלקום", "פלאפון", "גולן טלקום"];

export default function AppHeader() {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [selectedOperator, setSelectedOperator] = useState("הוט מובייל");
  const [operatorOpen, setOperatorOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // שיפור: ה-State בודק את ה-sessionStorage כבר ברגע היצירה שלו
  const [currentUser, setCurrentUser] = useState<{ name: string; domain?: string }>(() => {
    const savedUser = sessionStorage.getItem("npg_user");
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        return { name: "אורח" };
      }
    }
    return { name: "אורח" };
  });

  useEffect(() => {
    // פונקציה לעדכון המשתמש
    const updateUser = () => {
      const savedUser = sessionStorage.getItem("npg_user");
      if (savedUser) {
        try {
          setCurrentUser(JSON.parse(savedUser));
        } catch (e) {
          console.error("שגיאה בקריאת נתוני משתמש");
        }
      } else {
        setCurrentUser({ name: "אורח" });
      }
    };

    // האזנה לאירוע 'storage' למקרה שהנתונים משתנים בחלון אחר
    window.addEventListener('storage', updateUser);

    // סגירת דרוקדאונים בלחיצה בחוץ
    const handler = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
        setOperatorOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      window.removeEventListener('storage', updateUser);
    };
  }, []);

  return (
    <header
      ref={headerRef}
      dir="rtl"
      className="relative z-[1000] h-20 shrink-0 border-b border-border bg-[#D9E4F0] text-header-foreground shadow-sm"
    >
      <div className="flex h-full w-full items-center justify-between gap-3 px-3 sm:px-4">

        {/* לוגו NPG */}
        <div className="flex shrink-0 items-center" dir="ltr">
          <span className="z-30 flex h-10 w-10 items-center justify-center rounded-full bg-[#1A365D] text-sm font-bold text-black shadow-inner border border-white/10">
            N
          </span>
          <span className="z-20 -ml-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#556B2F] text-sm font-bold text-black shadow-inner border border-white/10">
            P
          </span>
          <span className="z-10 -ml-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#A0522D] text-sm font-bold text-black shadow-inner border border-white/10">
            G
          </span>
        </div>

        {/* תפריט ניווט */}
        <nav className="flex h-full items-center justify-center gap-1 px-1">
          {menuItems.map((item) => (
            <div key={item.label} className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                className={`flex items-center gap-1.5 rounded-full border border-blue-200 px-3 py-1.5 text-sm font-bold transition-all shadow-sm ${openDropdown === item.label
                  ? "bg-white border-blue-400 text-blue-700"
                  : "bg-white/80 text-header-foreground/90 hover:bg-white"
                  }`}
              >
                <item.icon size={13} className="opacity-80" />
                <span>{item.label}</span>
                <ChevronDown
                  size={12}
                  className={`transition-transform duration-200 ${openDropdown === item.label ? "rotate-180" : ""}`}
                />
              </button>

              {openDropdown === item.label && (
                <div className="absolute right-0 top-[calc(100%-10px)] z-[1001] mt-2 w-48 rounded-md border border-border bg-card py-1 shadow-xl animate-in fade-in slide-in-from-top-2">
                  {item.dropdownItems.map((subItem) => (
                    <button
                      key={subItem}
                      onClick={() => setOpenDropdown(null)}
                      className="block w-full px-3 py-1.5 text-right text-xs hover:bg-accent transition-colors"
                    >
                      {subItem}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* צד שמאל: סטטוס ומשתמש */}
        <div className="mr-auto flex shrink-0 items-center gap-3">

          <div className="flex items-center gap-2 rounded-full border border-blue-200 bg-white/90 px-4 py-2 shadow-sm">
            <span className="text-sm font-bold text-header-foreground">NPG ייצור</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (window.confirm("האם אתה בטוח שברצונך להתנתק?")) {
                  sessionStorage.removeItem("npg_user");
                  window.location.reload();
                }
              }}
              className="flex items-center gap-2 rounded-full border border-blue-200 bg-white/90 px-4 py-1.5 font-bold text-header-foreground/90 shadow-sm transition-colors hover:bg-red-50 hover:border-red-200 group"
              title="לחץ להתנתקות"
            >
              <div className="flex flex-col items-start leading-none min-w-[60px]">
                <span className="text-sm group-hover:text-red-600 transition-colors uppercase">
                  {currentUser.name}
                </span>
                {currentUser.domain && (
                  <span className="text-[10px] opacity-60 font-medium group-hover:text-red-400">
                    {currentUser.domain}
                  </span>
                )}
              </div>
              <User size={14} className="group-hover:text-red-600 transition-colors" />
              <div className="mr-1 border-r border-blue-200 h-4 group-hover:border-red-200" />
              <LogOut size={12} className="text-slate-400 group-hover:text-red-600 transition-colors" />
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => setOperatorOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-full border border-blue-200 bg-white/90 px-4 py-2 transition-colors hover:bg-white shadow-sm"
            >
              <span className="text-sm font-bold text-header-foreground/90 whitespace-nowrap">
                מפעיל: {selectedOperator}
              </span>
              <ChevronDown
                size={14}
                className={`text-header-foreground/70 transition-transform duration-200 ${operatorOpen ? "rotate-180" : ""}`}
              />
            </button>

            {operatorOpen && (
              <div className="absolute left-0 top-full z-50 mt-1 w-44 rounded-md border border-border bg-card py-1 text-card-foreground shadow-md animate-in fade-in slide-in-from-top-1">
                {operators.map((operator) => (
                  <button
                    key={operator}
                    onClick={() => {
                      setSelectedOperator(operator);
                      setOperatorOpen(false);
                    }}
                    className={`block w-full px-3 py-1.5 text-right text-xs transition-colors ${operator === selectedOperator
                      ? "bg-accent font-bold text-accent-foreground"
                      : "hover:bg-accent font-medium"
                      }`}
                  >
                    {operator}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}