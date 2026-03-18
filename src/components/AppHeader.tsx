import { useEffect, useRef, useState, useMemo } from "react";
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
import { useApp } from "@/context/AppContext";

// מיפוי אייקונים לפי שם התפריט שחוזר מהשרת
const ICON_MAP: Record<string, any> = {
  "הגדרות": Settings,
  "תפעול": Wrench,
  "תחזוקה": Cog,
  "טבלאות ניוד": Table2,
  "דוחות": FileText,
};

export default function AppHeader() {
  const { menu, lovs, currentNetworkId } = useApp();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);

  // חילוץ שם המפעיל הנבחר על סמך ה-ID שנבחר בלוגין
  const selectedOperatorDisplay = useMemo(() => {
    const identityOptions = lovs?.grp?.getOut?.data?.selfIdentity?.["value.options"]?.item;
    const domains = Array.isArray(identityOptions) ? identityOptions : identityOptions ? [identityOptions] : [];

    const currentDomain = domains.find(d => d.value?.["$"]?.toString() === currentNetworkId);
    return currentDomain?.displayValue?.["$"] || "לא נבחר";
  }, [lovs, currentNetworkId]);

  // עיבוד התפריט מה-Context למבנה נוח לרינדור
  const dynamicMenuItems = useMemo(() => {
    // 1. חילוץ המערך של התפריטים (בדיקה של כמה נתיבים אפשריים)
    const rawMenu = menu?.grp?.menuList?.menuDoc;

    console.log("AppHeader: rawMenu data:", rawMenu); // לוג לבדיקה

    if (!rawMenu || !Array.isArray(rawMenu)) {
      console.warn("AppHeader: Menu data is not an array or is missing");
      return [];
    }

    return rawMenu.map((group: any) => {
      // 2. חילוץ הפריטים בתוך כל קטגוריה
      const itemsContainer = group.items?.item;

      let dropdownItems: string[] = [];
      if (Array.isArray(itemsContainer)) {
        dropdownItems = itemsContainer.map(i => i.text?.["$"]).filter(Boolean);
      } else if (itemsContainer?.text?.["$"]) {
        dropdownItems = [itemsContainer.text["$"]];
      }

      return {
        label: group.text?.["$"] || "ללא שם",
        icon: ICON_MAP[group.text?.["$"]] || Settings,
        dropdownItems
      };
    });
  }, [menu]);

  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = sessionStorage.getItem("npg_user");
    if (savedUser) return JSON.parse(savedUser);
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

        {/* תפריט ניווט דינמי מהשרת */}
        <nav className="flex h-full items-center justify-center gap-1 px-1">
          {dynamicMenuItems.map((item) => (
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
                    <button key={subItem} className="block w-full px-3 py-1.5 text-right text-xs hover:bg-accent whitespace-nowrap">
                      {subItem}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* צד שמאל: סטטוס, משתמש ומפעיל נבחר */}
        <div className="mr-auto flex shrink-0 items-center gap-3">
          <div className="hidden md:flex items-center gap-2 rounded-full border border-blue-200 bg-white/90 px-4 py-2 shadow-sm">
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

          {/* הצגת המפעיל שנבחר בלוגין */}
          <div className="flex items-center gap-2 rounded-full border border-blue-200 bg-[#1A365D] px-4 py-2 shadow-sm">
            <span className="text-sm font-bold text-white whitespace-nowrap">
              מפעיל: {selectedOperatorDisplay}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}