import { useState, useRef, useEffect } from "react";
import {
  Settings,
  Wrench,
  Cog,
  Table2,
  FileText,
  ChevronDown,
  User,
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
    dropdownItems: ["תכנית מספור ארצית", "נתוני ניוד"],
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
    const handler = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
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
      className="bg-[hsl(215,28%,17%)] h-16 max-h-16 shrink-0"
    >
      <div className="flex items-center justify-between h-full px-4">
        {/* Right side - Logo + Title */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="w-7 h-7 rounded-full bg-header-accent flex items-center justify-center text-primary-foreground font-bold text-xs">N</span>
          <span className="w-7 h-7 rounded-full bg-npg-green flex items-center justify-center text-primary-foreground font-bold text-xs">P</span>
          <span className="w-7 h-7 rounded-full bg-npg-amber flex items-center justify-center text-primary-foreground font-bold text-xs">G</span>
          <h1 className="text-sm font-bold text-header-accent mr-1">מערכת ניוד מספרים</h1>
        </div>

        {/* Center - Navigation */}
        <nav className="flex items-center gap-0">
          {menuItems.map((item) => (
            <div key={item.label} className="relative">
              <button
                onClick={() =>
                  setOpenDropdown(openDropdown === item.label ? null : item.label)
                }
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-medium text-[hsl(0,0%,85%)] hover:text-[hsl(0,0%,100%)] hover:bg-[hsl(215,28%,25%)] transition-colors whitespace-nowrap"
              >
                <item.icon size={14} />
                <span>{item.label}</span>
                <ChevronDown
                  size={11}
                  className={`transition-transform ${openDropdown === item.label ? "rotate-180" : ""}`}
                />
              </button>
              {openDropdown === item.label && (
                <div className="absolute top-full right-0 mt-1 w-48 bg-card rounded-lg shadow-xl border border-border z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-150">
                  {item.dropdownItems.map((sub) => (
                    <button
                      key={sub}
                      className="w-full text-right px-4 py-2 text-xs text-card-foreground hover:bg-accent transition-colors"
                      onClick={() => setOpenDropdown(null)}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* Left side - User info */}
        <div className="flex items-center gap-4 shrink-0" dir="ltr">
          <div className="relative">
            <button
              onClick={() => setOperatorOpen(!operatorOpen)}
              className="flex items-center gap-1.5 text-xs text-[hsl(0,0%,75%)] hover:text-[hsl(0,0%,100%)] transition-colors"
            >
              <ChevronDown size={11} className={`transition-transform ${operatorOpen ? "rotate-180" : ""}`} />
              <span>מפעיל : {selectedOperator}</span>
            </button>
            {operatorOpen && (
              <div className="absolute top-full left-0 mt-1 w-44 bg-card rounded-lg shadow-xl border border-border z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-150">
                {operators.map((op) => (
                  <button
                    key={op}
                    className={`w-full text-right px-4 py-2 text-xs transition-colors ${
                      op === selectedOperator
                        ? "bg-accent text-accent-foreground font-medium"
                        : "text-card-foreground hover:bg-accent"
                    }`}
                    onClick={() => {
                      setSelectedOperator(op);
                      setOperatorOpen(false);
                    }}
                  >
                    {op}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[hsl(0,0%,75%)]">
            <User size={14} />
            <span>Ori Livne</span>
          </div>

          <div className="text-center leading-tight">
            <div className="text-xs font-bold text-[hsl(0,0%,95%)]">NPG</div>
            <div className="text-[10px] text-[hsl(0,0%,60%)]">PROD</div>
          </div>
        </div>
      </div>
    </header>
  );
}
