import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Cog,
  FileText,
  Settings,
  Table2,
  User,
  Wrench,
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

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
        setOperatorOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    // 1. שינוי ב-Header: הסרת ה-max-h וה-shrink-0 שחונקים את הגובה
    <header
      ref={headerRef}
      dir="rtl"
      className="relative z-[1000] w-full border-b border-border bg-header text-header-foreground shadow-sm"
    >
      <div className="flex h-16 w-full items-center justify-between gap-3 px-3 sm:px-4">

        {/* לוגו - סידרתי את ה-HTML שיופיע כ-NPG מימין לשמאל ב-RTL */}
        <div className="flex items-center gap-1">
          {/* ה-G מופיע ראשון בקוד, לכן ב-RTL הוא יהיה הכי שמאלי */}
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-npg-amber text-[11px] font-bold text-primary-foreground">
            G
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-npg-green text-[11px] font-bold text-primary-foreground">
            P
          </span>
          {/* ה-N מופיע אחרון בקוד, לכן ב-RTL הוא יהיה הכי ימני */}
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-header-accent text-[11px] font-bold text-primary-foreground">
            N
          </span>
        </div>

        {/* 2. שינוי ב-Nav: הסרת ה-overflow וה-scrollbar שגרמו לבעיה בצילום המסך */}
        <nav className="flex h-full items-center justify-center gap-1 px-1">
          {menuItems.map((item) => (
            <div key={item.label} className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === item.label ? null : item.label)}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-header-foreground/90 transition-colors hover:bg-secondary"
              >
                <span>{item.label}</span>
                <item.icon size={13} className="opacity-80" />
                <ChevronDown size={12} className={`transition-transform ${openDropdown === item.label ? "rotate-180" : ""}`} />
              </button>

              {/* התפריט הצף */}
              {openDropdown === item.label && (
                <div className="absolute right-0 top-[calc(100%-10px)] z-[1001] mt-2 w-48 rounded-md border border-border bg-card py-1 shadow-xl">
                  {item.dropdownItems.map((subItem) => (
                    <button
                      key={subItem}
                      onClick={() => setOpenDropdown(null)}
                      className="block w-full px-3 py-1.5 text-right text-xs hover:bg-accent"
                    >
                      {subItem}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>


        <div className="flex shrink-0 items-center gap-2 text-xs">
          <div className="rounded-full border border-border bg-secondary px-2 py-1 text-center leading-tight">
            <div className="font-bold text-header-foreground">NPG</div>
            <div className="text-[10px] text-muted-foreground">PROD</div>
          </div>

          <div className="flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-1 text-header-foreground/90">
            <span>Ori Livne</span>
            <User size={13} />
          </div>

          <div className="relative">
            <button
              onClick={() => setOperatorOpen((prev) => !prev)}
              className="flex items-center gap-1 rounded-full border border-border bg-secondary px-2.5 py-1 text-header-foreground/90 transition-colors hover:bg-accent"
            >
              <span className="whitespace-nowrap">מפעיל: {selectedOperator}</span>
              <ChevronDown
                size={12}
                className={`transition-transform ${operatorOpen ? "rotate-180" : ""}`}
              />
            </button>

            {operatorOpen && (
              <div className="absolute left-0 top-full z-50 mt-1 w-44 rounded-md border border-border bg-card py-1 text-card-foreground shadow-md">
                {operators.map((operator) => (
                  <button
                    key={operator}
                    onClick={() => {
                      setSelectedOperator(operator);
                      setOperatorOpen(false);
                    }}
                    className={`block w-full px-3 py-1.5 text-right text-xs transition-colors ${operator === selectedOperator
                      ? "bg-accent font-medium text-accent-foreground"
                      : "hover:bg-accent"
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
