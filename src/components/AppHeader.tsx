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
  Globe
} from "lucide-react";
import { APP_CONFIG } from "@/config";
import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";

const ICON_MAP: Record<string, any> = {
  "הגדרות": Settings,
  "תפעול": Wrench,
  "תחזוקה": Cog,
  "טבלאות ניוד": Table2,
  "דוחות": FileText,
};

export default function AppHeader() {
  // 1. מושכים את currentNetworkName ישירות מה-Context
  const { menu, currentNetworkName, setCurrentNetworkId } = useApp();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();

  const handleSubItemClick = (subItem: string) => {
    if (subItem === "הגדרות יומן") {
      navigate("/calendar");
    } else if (subItem === "ניהול תהליכים") {
      navigate("/manage-processes"); // הולך לנתיב הניהול
    }
    else if (subItem === "צפייה בתהליכים") {
      navigate("/view-processes"); // הולך לנתיב הצפייה
    }
    else {
      // כל שאר האופציות שעדיין לא פיתחנו
      navigate("/not-found-yet");
    }

    setOpenDropdown(null);
  };

  const dynamicMenuItems = useMemo(() => {
    const rawMenu = (menu as any)?.data?.menuDoc || [];

    return rawMenu.map((group: any) => {
      const itemsArray = group.items?.item || [];
      const dropdownItems = Array.isArray(itemsArray)
        ? itemsArray.map((i: any) => i.text)
        : [itemsArray.text];

      return {
        label: group.text || "ללא שם",
        icon: ICON_MAP[group.text] || Settings,
        dropdownItems: dropdownItems.filter(Boolean)
      };
    });
  }, [menu]);

  const [currentUser] = useState(() => {
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

        {/* לוגו */}
        <div className="flex shrink-0 items-center" dir="ltr">
          <span className="z-30 flex h-10 w-10 items-center justify-center rounded-full bg-[#1A365D] text-sm font-bold text-white shadow-inner">N</span>
          <span className="z-20 -ml-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#556B2F] text-sm font-bold text-white shadow-inner">P</span>
          <span className="z-10 -ml-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#A0522D] text-sm font-bold text-white shadow-inner">G</span>
        </div>

        {/* תפריט ניווט */}
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
            <div className="flex items-center gap-2 rounded-full border border-blue-200 bg-white/90 px-4 py-1.5 font-bold shadow-sm">
              <span className="text-sm uppercase text-slate-700">{currentUser.name}</span>
              <User size={14} className="text-blue-500" />
            </div>

            {currentUser.name !== "אורח" && (
              <button onClick={handleLogout} className="p-2 rounded-full hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors">
                <LogOut size={16} />
              </button>
            )}
          </div>

          {/* תצוגת מפעיל - משתמשת ב-currentNetworkName מה-Context */}
          <div className="flex items-center gap-2 rounded-full border border-blue-200 bg-[#1A365D] px-4 py-2 shadow-sm">
            <Globe size={14} className="text-blue-300" />
            <span className="text-sm font-bold text-white whitespace-nowrap">
              מפעיל: {currentNetworkName}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}