import { useEffect, useRef, useState, useMemo } from "react";
import {
  ChevronDown,
  Cog,
  FileText,
  Settings,
  Table2,
  User,
  Wrench,
  LogOut,
  Globe,
  Info,
  X,
  ShieldCheck
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";
import { APP_CONFIG } from "@/config"; // <-- ייבוא קובץ הקונפיגורציה שלך

const ICON_MAP: Record<string, any> = {
  "הגדרות": Settings,
  "תפעול": Wrench,
  "תחזוקה": Cog,
  "טבלאות ניוד": Table2,
  "דוחות": FileText,
};

export default function AppHeader() {
  const { menu, currentNetworkName, currentUser, setCurrentNetworkId } = useApp();

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [isAboutOpen, setIsAboutOpen] = useState(false); // <-- הסטייט למודאל האודות

  const headerRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();

  const handleSubItemClick = (subItem: any) => {
    if (!subItem) return;

    const itemText = typeof subItem === 'object' ? subItem?.["$"] : subItem;
    const cleanText = itemText?.trim();

    if (cleanText === "הגדרות יומן") {
      navigate("/calendar");
    } else if (cleanText === "ניהול תהליכים") {
      navigate("/manage-processes");
    } else if (cleanText === "צפייה בתהליכים") {
      navigate("/view-processes");
    } else if (cleanText === "נתוני ניוד") {
      navigate("/dnRouteNumbers");
    } else if (cleanText === "תכנית מספור ארצית") {
      navigate("/NumberingPlan");
    } else if (cleanText === "צפייה באירועים") {
      navigate("/GetEventList");
    } else if (cleanText === "צפייה במסרים") {
      navigate("/GetMessages");
    } else if (cleanText === "שאילתת מספר") {
      navigate("/NumberInquiry");
    } else if (cleanText === "תיזמון משימות") {
      navigate("/HousekeepingScheduler");
    } else if (cleanText === "ניהול מפעילים") {
      navigate("/OperatorManagement");
    } else if (cleanText === "בריאות מערכת") {
      navigate("/NPGControlTower")
    } else if (cleanText === "לוח בקרה עיסקי") {
      navigate("/SummaryActivities")
    }
    else {
      navigate("/not-found-yet");
    }

    setOpenDropdown(null);
  };

  const dynamicMenuItems = useMemo(() => {
    const rawMenu = (menu as any)?.data?.menuDoc || [];

    return rawMenu
      .map((group: any) => {
        const itemsArray = group.items?.item || [];

        const dropdownItems = Array.isArray(itemsArray)
          ? itemsArray.map((i: any) => i.text)
          : itemsArray?.text ? [itemsArray.text] : [];

        return {
          label: group.text || "ללא שם",
          icon: ICON_MAP[group.text] || Settings,
          dropdownItems: dropdownItems.filter(Boolean)
        };
      })
      .filter((group: any) => group.dropdownItems.length > 0);
  }, [menu]);

  const handleLogout = () => {
    if (window.confirm("האם אתה בטוח שברצונך להתנתק?")) {
      sessionStorage.clear();
      localStorage.clear();
      window.location.href = "/";
    }
  };

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
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

        {/* לוגו */}
        <div className="flex shrink-0 items-center" dir="ltr">
          <span className="z-30 flex h-10 w-10 items-center justify-center rounded-full bg-[#1A365D] text-sm font-bold text-white shadow-inner">N</span>
          <span className="z-20 -ml-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#556B2F] text-sm font-bold text-white shadow-inner">P</span>
          <span className="z-10 -ml-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#A0522D] text-sm font-bold text-white shadow-inner">G</span>
        </div>

        {/* תפריט ניווט */}
        <nav className="flex h-full items-center justify-center gap-1 px-1">
          {dynamicMenuItems.map((item: any) => (
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
                  {item.dropdownItems.map((subItem: string) => (
                    <button
                      key={subItem}
                      onClick={() => handleSubItemClick(subItem)}
                      className="block w-full px-3 py-1.5 text-right text-xs hover:bg-accent whitespace-nowrap text-slate-700"
                    >
                      {subItem}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* צד שמאל: משתמש ומפעיל */}
        <div className="mr-auto flex shrink-0 items-center gap-3">
          <div className="flex items-center gap-2">

            {/* --- כפתור אודות החדש --- */}
            <button
              onClick={() => setIsAboutOpen(true)}
              className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-white/50 rounded-full transition-all"
              title="אודות המערכת"
            >
              <Info size={20} />
            </button>

            <div className="flex items-center gap-2 rounded-full border border-blue-200 bg-white/90 px-4 py-1.5 font-bold shadow-sm">
              <span className="text-sm uppercase text-slate-700">
                {currentUser?.name || "אורח"}
              </span>
              <User size={14} className="text-blue-500" />
            </div>

            {currentUser && currentUser.name !== "אורח" && (
              <button
                onClick={handleLogout}
                className="p-2 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                title="התנתקות"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 rounded-full border border-blue-200 bg-[#1A365D] px-4 py-2 shadow-sm">
            <Globe size={14} className="text-blue-300" />
            <span className="text-sm font-bold text-white whitespace-nowrap">
              מפעיל: {currentNetworkName || "טוען..."}
            </span>
          </div>
        </div>
      </div>

      {/* --- מודאל אודות (About Modal) מעוצב ונקי --- */}
      {isAboutOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-100 animate-in zoom-in-95" dir="rtl">

            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <span className="font-bold text-sm text-slate-700">אודות המערכת</span>
              <button
                onClick={() => setIsAboutOpen(false)}
                className="p-1 text-slate-400 hover:bg-slate-200 rounded-full transition-all"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center text-center">
              <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl mb-4 border border-blue-100">
                <ShieldCheck size={36} />
              </div>

              {/* שליפת השם והגרסה מקובץ הקונפיגורציה */}
              <h3 className="text-lg font-black text-slate-800">{APP_CONFIG.APP_NAME}</h3>
              <p className="text-xs text-slate-400 mt-1">NPG Enterprise Solution</p>

              <div className="w-full bg-slate-50 rounded-xl p-3 mt-5 space-y-2 border border-slate-100 text-right">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-500">גרסת מערכת (UI):</span>
                  <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    v{APP_CONFIG.VERSION}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-200/60">
                  <span className="font-bold text-slate-500">שרת קישוריות:</span>
                  <span className="font-bold text-slate-700">TIBCO ActiveMatrix</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 mt-6">
                © {new Date().getFullYear()} כל הזכויות שמורות לצוות הפיתוח
              </p>
            </div>

          </div>
        </div>
      )}

    </header>
  );
}