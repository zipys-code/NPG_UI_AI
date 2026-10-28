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
  ShieldCheck,
  Waypoints // <-- נוודא שזה מיובא
} from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useNavigate } from "react-router-dom";

// ייבוא הקומפוננטה החדשה מהנתיב שיצרת
import { ProcessFlowDrawer } from "@/components/ProcessFlowDrawer/ProcessFlowDrawer";

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
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isFlowDrawerOpen, setIsFlowDrawerOpen] = useState(false); // <-- סטייט חדש לפאנל תרשימים

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
    } else if (cleanText === "טבלאות קוד") {
      navigate("/CodeTables")
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

            {/* --- כפתור מילון תהליכים החדש --- */}
            {/* <button
              onClick={() => setIsFlowDrawerOpen(true)}
              className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-white/50 rounded-full transition-all"
              title="מילון תהליכים ותרשימי זרימה"
            >
              <Waypoints size={20} />
            </button> */}

            {/* --- כפתור אודות --- */}
            <button
              onClick={() => setIsAboutOpen(true)}
              className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-white/50 rounded-full transition-all"
              title="אודות המערכת"
            >
              <Info size={20} />
            </button>

            <div
              className="flex items-center gap-2 rounded-full border border-blue-200 bg-white/90 px-4 py-1.5 font-bold shadow-sm cursor-help"
              title={currentUser?.roleId || "לא בוצעה כניסה תקינה"}
            >
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

      {isAboutOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[420px] overflow-hidden border border-slate-100 animate-in zoom-in-95" dir="rtl">

            {/* כותרת */}
            <div className="bg-blue-600 px-6 py-4 flex justify-between items-center text-white shrink-0 shadow-md">
              <div className="flex items-center gap-3">
                <Info size={20} />
                <h2 className="text-base font-bold">אודות המערכת</h2>
              </div>
              <button
                onClick={() => setIsAboutOpen(false)}
                className="text-white/80 hover:text-white transition-colors p-1"
              >
                <X size={22} />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center text-center">

              {/* לוגו NPG */}
              <div className="mb-4">
                <div className="flex shrink-0 items-center scale-125 origin-center" dir="ltr">
                  <span className="z-30 flex h-10 w-10 items-center justify-center rounded-full bg-[#1A365D] text-sm font-bold text-white shadow-inner">N</span>
                  <span className="z-20 -ml-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#556B2F] text-sm font-bold text-white shadow-inner">P</span>
                  <span className="z-10 -ml-4 flex h-10 w-10 items-center justify-center rounded-full bg-[#A0522D] text-sm font-bold text-white shadow-inner">G</span>
                </div>
              </div>

              <h3 className="text-lg font-black text-slate-800">{(window as any).APP_CONFIG.APP_NAME}</h3>

              <div className="w-full bg-slate-50 rounded-xl p-3 mt-5 space-y-2 border border-slate-100 text-right">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-500">גרסת מערכת (UI):</span>
                  <span className="font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    v{(window as any).APP_CONFIG.VERSION}
                  </span>
                </div>
              </div>

              {/* --- אזור שירות ותמיכה חדש --- */}
              <div className="w-full bg-slate-50/80 rounded-xl p-4 mt-4 border border-slate-200 text-right text-[11.5px] leading-relaxed">
                <h4 className="font-bold text-slate-800 mb-1.5">3. אופן הפניה לקבלת שרות</h4>
                <p className="text-slate-600 mb-2">אופן הפניה לקבלת שרות יבוצע באחת מהאפשרויות הבאות:</p>
                <ul className="space-y-2 text-slate-700 list-disc list-inside">
                  <li>
                    <span className="font-medium">פורטל לקוחות (24/7): </span>
                    <a href="http://support.yaelsoft.com" target="_blank" rel="noreferrer" className="text-blue-600 hover:underline font-mono select-all ml-1" dir="ltr">http://support.yaelsoft.com</a>
                  </li>
                  <li>
                    <span className="font-medium">דואר אלקטרוני: </span>
                    <a href="mailto:support@yaelsoft.com" className="text-blue-600 hover:underline font-mono select-all ml-1" dir="ltr">support@yaelsoft.com</a>
                  </li>
                  <li>
                    <span className="font-medium">מוקד תמיכה טלפוני: </span>
                    <span className="font-mono text-slate-800 font-bold select-all ml-1" dir="ltr">09-7639444</span>
                  </li>
                </ul>
              </div>

              {/* --- אזור זכויות יוצרים ולוגו יעל --- */}
              <div className="flex justify-between items-center w-full mt-6 pt-4 border-t border-slate-100">
                <p className="text-[10px] text-slate-400">
                  © {new Date().getFullYear()} כל הזכויות שמורות לצוות הפיתוח
                </p>

                <img
                  src="/yael-logo.png"
                  alt="Yael Software"
                  className="h-11 object-contain"
                />
              </div>

            </div>
          </div>
        </div>
      )}

      {/* הקריאה לקומפוננטת הפאנל החדשה! */}
      <ProcessFlowDrawer
        isOpen={isFlowDrawerOpen}
        onClose={() => setIsFlowDrawerOpen(false)}
      />

    </header>
  );
}