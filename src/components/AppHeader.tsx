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
import { APP_CONFIG } from "@/config";

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

  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = sessionStorage.getItem("npg_user");
    if (savedUser) {
      return JSON.parse(savedUser);
    }
    return { name: APP_CONFIG.LOGIN_REQUIRED === "N" ? "אורח" : "" };
  });

  const handleLogout = () => {
    if (window.confirm("האם אתה בטוח שברצונך להתנתק?")) {
      sessionStorage.clear();
      window.location.reload();
    }
  };

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
    <header
      ref={headerRef}
      dir="rtl"
      className="relative z-[1000] h-20 shrink-0 border-b border-border bg-[#D9E4F0] text-header-foreground shadow-sm"
    >
      <div className="flex h-full w-full items-center justify-between gap-3 px-3 sm:px-4">

        {/* לוגו NPG */}
        <div className="flex shrink-0 items-center" dir="ltr">
          <span className="z-30 flex h-10 w-10 items-center justify-center rounded-full bg-[#1A365D] text-sm font-bold text-white shadow-inner">N</span>
          <span className="z-20 -ml-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#556B2F] text-sm font-bold text-white shadow-inner">P</span>
          <span className="z-10 -ml-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#A0522D] text-sm font-bold text-white shadow-inner">G</span>
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
                <ChevronDown size={12} className={`transition-transform ${openDropdown === item.label ? "rotate-180" : ""}`} />
              </button>
              {openDropdown === item.label && (
                <div className="absolute right-0 top-[calc(100%-10px)] z-[1001] mt-2 w-48 rounded-md border border-border bg-card py-1 shadow-xl">
                  {item.dropdownItems.map((subItem) => (
                    <button key={subItem} className="block w-full px-3 py-1.5 text-right text-xs hover:bg-accent">{subItem}</button>
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

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-blue-200 bg-white/90 px-4 py-1.5 font-bold shadow-sm">
              <span className="text-sm uppercase text-slate-700">{currentUser.name}</span>
              <User size={14} className="text-blue-500" />
            </div>

            {APP_CONFIG.LOGIN_REQUIRED === "Y" && currentUser.name !== "אורח" && (
              <button
                onClick={handleLogout}
                className="p-2 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                title="התנתק"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setOperatorOpen((prev) => !prev)}
              className="flex items-center gap-2 rounded-full border border-blue-200 bg-white/90 px-4 py-2 hover:bg-white shadow-sm"
            >
              <span className="text-sm font-bold text-header-foreground/90 whitespace-nowrap">מפעיל: {selectedOperator}</span>
              <ChevronDown size={14} className={`transition-transform ${operatorOpen ? "rotate-180" : ""}`} />
            </button>
            {operatorOpen && (
              <div className="absolute left-0 top-full z-50 mt-1 w-44 rounded-md border border-border bg-card py-1 shadow-md">
                {operators.map((op) => (
                  <button key={op} onClick={() => { setSelectedOperator(op); setOperatorOpen(false); }} className="block w-full px-3 py-1.5 text-right text-xs hover:bg-accent">{op}</button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}