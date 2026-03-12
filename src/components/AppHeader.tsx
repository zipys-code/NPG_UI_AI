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
  { label: "דוחות", icon: FileText, hasDropdown: true },
  { label: "טבלאות ניוד", icon: Table2, hasDropdown: true },
  { label: "תחזוקה", icon: Cog, hasDropdown: true },
  { label: "תפעול", icon: Wrench, hasDropdown: false },
  {
    label: "הגדרות",
    icon: Settings,
    hasDropdown: true,
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
];

const operators = ["הוט מובייל", "פרטנר", "סלקום", "פלאפון", "גולן טלקום"];

export default function AppHeader() {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [selectedOperator, setSelectedOperator] = useState("הוט מובייל");
  const [operatorOpen, setOperatorOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
        setOperatorOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="bg-header text-header-foreground" ref={dropdownRef}>
      {/* Top nav row */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-header-foreground/10">
        {/* Right side - Logo and title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="w-8 h-8 rounded-full bg-header-accent flex items-center justify-center text-header-foreground font-bold text-sm">N</span>
            <span className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-header-foreground font-bold text-sm">P</span>
            <span className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-header-foreground font-bold text-sm">G</span>
          </div>
          <h1 className="text-lg font-bold tracking-wide">
            <span className="text-header-accent">מערכת ניוד מספרים</span>
          </h1>
        </div>

        {/* Center - Nav items */}
        <nav className="flex items-center gap-1">
          {menuItems.map((item) => (
            <div key={item.label} className="relative">
              <button
                onClick={() =>
                  item.hasDropdown
                    ? setOpenDropdown(openDropdown === item.label ? null : item.label)
                    : setOpenDropdown(null)
                }
                className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium text-header-foreground/80 hover:text-header-foreground hover:bg-header-foreground/10 transition-colors"
              >
                <item.icon size={16} />
                <span>{item.label}</span>
                {item.hasDropdown && (
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${openDropdown === item.label ? "rotate-180" : ""}`}
                  />
                )}
              </button>
              {item.hasDropdown && item.dropdownItems && openDropdown === item.label && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-card rounded-lg shadow-xl border border-border z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-150">
                  {item.dropdownItems.map((sub) => (
                    <button
                      key={sub}
                      className="w-full text-right px-4 py-2.5 text-sm text-card-foreground hover:bg-accent transition-colors"
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
      </div>

      {/* Second row - User info */}
      <div className="flex items-center justify-between px-6 py-2">
        <div className="flex items-center gap-6">
          {/* Operator selector */}
          <div className="relative">
            <button
              onClick={() => setOperatorOpen(!operatorOpen)}
              className="flex items-center gap-2 text-sm text-header-foreground/70 hover:text-header-foreground transition-colors"
            >
              <span>מפעיל : {selectedOperator}</span>
              <ChevronDown size={14} className={`transition-transform ${operatorOpen ? "rotate-180" : ""}`} />
            </button>
            {operatorOpen && (
              <div className="absolute top-full right-0 mt-1 w-48 bg-card rounded-lg shadow-xl border border-border z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-150">
                {operators.map((op) => (
                  <button
                    key={op}
                    className={`w-full text-right px-4 py-2 text-sm transition-colors ${
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

          {/* User info */}
          <div className="flex items-center gap-2 text-sm text-header-foreground/70">
            <User size={16} />
            <span>Ori Livne</span>
          </div>
        </div>

        {/* Environment label */}
        <div className="text-center">
          <div className="text-sm font-bold text-header-foreground/90">NPG</div>
          <div className="text-xs text-header-foreground/50">PROD</div>
        </div>
      </div>
    </header>
  );
}
