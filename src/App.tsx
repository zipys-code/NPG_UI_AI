import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AlertTriangle, LogOut, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { APP_CONFIG } from "@/config";
import { LoginModal } from "@/components/Login/LoginModal.tsx";
import AppHeader from "@/components/App/AppHeader.tsx";
import ProcessManagement from './components/Process/ProcessManagement.tsx';
import NotFound from "./pages/NotFound.tsx";
import { Calendar } from "./components/Calendar/Calendar.tsx";
import DnRouteNumbers from './components/DnRouteNumbers/DnRouteNumbers.tsx';
import NumberingPlan from './components/NumberingPlan/NumberingPlan.tsx';
import GetEventList from './components/Event/EventViewer.tsx';

import { AppProvider, useApp } from "@/context/AppContext";
import { fetchLOVs, apiRequest } from "@/services/api";
import { HIDDEN_MENUS } from "./components/App/AppConfig.ts";
import GetMessages from "./components/Messages/GetMessages.tsx";
import NumberInquiry from "./components/NumberInquiry/NumberInquiry.tsx";
import HousekeepingScheduler from "./components/HousekeepingScheduler/HousekeepingScheduler.tsx";
import OperatorManagement from "./components/NetworksInterfaces/OperatorManagement.tsx";
import { NPGControlTower } from "./components/ControlTower/NPGControlTower.tsx";
import SummaryActivities from "./components/SummaryActivities/SummaryActivities.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // ביטול רענון אוטומטי כשחוזרים לחלון
      retry: false,                // ביטול ניסיונות חוזרים אוטומטיים בשגיאה
      staleTime: Infinity,         // הנתונים ייחשבו כ"טריים" לתמיד (עד רענון ידני)
    },
  },
});

const AppContent = () => {
  const {
    setAppData,
    setCurrentUser,
    setCurrentNetworkId,
    setCurrentNetworkName,
    currentUser,
    currentNetworkId,
    setToken,
    setRoleId
  } = useApp();

  const [isInitializing, setIsInitializing] = useState(true);
  const [needsReload, setNeedsReload] = useState(false);
  const isLoginRequired = APP_CONFIG.LOGIN_REQUIRED === "Y";
  const [serverError, setServerError] = useState<string | null>(null);

  // 1. מאזין לאירוע שינוי קונפיגורציה (Restart) מה-API
  useEffect(() => {
    const handleConfigChange = () => {
      console.log("System config changed event received");
      setNeedsReload(true);
    };

    window.addEventListener('app:config-changed', handleConfigChange);
    return () => window.removeEventListener('app:config-changed', handleConfigChange);
  }, []);

  // 2. אתחול האפליקציה (LOVs, Session, ונתוני תפריט)
  useEffect(() => {
    const initApp = async () => {
      try {
        // א. טעינת LOVs (בסיס לכל האפליקציה)
        const lovsData = await fetchLOVs();
        if (lovsData) {
          setAppData({ lovs: lovsData });
          setServerError(null); // הכל תקין
        } else {
          // מקרה שהתקבל null אבל לא נזרקה שגיאה
          throw new Error("לא ניתן היה לטעון נתוני תשתית");
        }

        const dynamicToken = `NPDUMMY_${Date.now()}`;
        const defId = APP_CONFIG.DEFAULT_SELFNETWORKID;

        // ב. תרחיש ללא לוגין (אורח)
        if (!isLoginRequired) {
          const guestUser = {
            name: APP_CONFIG.DEFAULT_USERNAME || "אורח",
            roleId: APP_CONFIG.ROLE_ID,
            token: dynamicToken,
            permissions: { canAddProcess: true }
          };

          setToken(dynamicToken);
          setRoleId(APP_CONFIG.ROLE_ID);
          setCurrentUser(guestUser);
          setCurrentNetworkId(defId);

          const menuData = await apiRequest('/GetMenuList', {
            getIn: {
              roleID: guestUser.roleId,
              selfNetworkID: defId,
              token: dynamicToken
            }
          });
          if (menuData) {
            console.log("נתוני תפריט לפני הסינון:", menuData);
            //const HIDDEN_MENUS = ["דוחות", "טבלאות קוד"];

            // חילוץ לפי המבנה שרואים בלוג: data -> menuDoc
            const menuDocs = menuData.data?.menuDoc;

            if (menuDocs) {
              const menuArray = Array.isArray(menuDocs) ? menuDocs : [menuDocs];

              // סינון התפריטים ברמה הראשית (דוחות, הגדרות וכו')
              const filteredDocs = menuArray.filter((doc: any) => {
                const title = doc.text?.["$"] || doc.text;
                return !HIDDEN_MENUS.includes(title);
              });

              // שימי לב: "טבלאות קוד" נמצא בתוך "הגדרות" כתת-תפריט!
              // אם את רוצה להסיר אותו משם, צריך לעבור על ה-items:
              filteredDocs.forEach((doc: any) => {
                if (doc.items?.item && Array.isArray(doc.items.item)) {
                  doc.items.item = doc.items.item.filter((subItem: any) => {
                    const subTitle = subItem.text?.["$"] || subItem.text;
                    return !HIDDEN_MENUS.includes(subTitle);
                  });
                }
              });

              console.log("מערך התפריטים אחרי הסינון:", filteredDocs);

              // עדכון המבנה החדש
              menuData.data.menuDoc = filteredDocs;
            }

            setAppData({ menu: menuData });
          }



        } else {
          // ג. תרחיש לוגין נדרש - בדיקת רענון (Refresh)
          const savedUserStr = sessionStorage.getItem("userData");
          if (savedUserStr) {
            const user = JSON.parse(savedUserStr);
            // שים לב: אנחנו מוודאים חילוץ מכל וריאציה של roleId שהשרת מחזיר
            const savedRoleId = user.roleId || user.roleID || "";
            const savedToken = user.token || "";

            setCurrentUser(user);
            setToken(savedToken);
            setRoleId(savedRoleId);
            setCurrentNetworkId(defId);

            const menuData = await apiRequest('/GetMenuList', {
              getIn: {
                roleID: savedRoleId,
                selfNetworkID: defId,
                token: savedToken
              }
            });
            if (menuData) {
              console.log("נתוני תפריט לפני הסינון:", menuData);
              //const HIDDEN_MENUS = ["דוחות", "טבלאות קוד"];

              // חילוץ לפי המבנה שרואים בלוג: data -> menuDoc
              const menuDocs = menuData.data?.menuDoc;

              if (menuDocs) {
                const menuArray = Array.isArray(menuDocs) ? menuDocs : [menuDocs];

                // סינון התפריטים ברמה הראשית (דוחות, הגדרות וכו')
                const filteredDocs = menuArray.filter((doc: any) => {
                  const title = doc.text?.["$"] || doc.text;
                  return !HIDDEN_MENUS.includes(title);
                });

                // שימי לב: "טבלאות קוד" נמצא בתוך "הגדרות" כתת-תפריט!
                // אם את רוצה להסיר אותו משם, צריך לעבור על ה-items:
                filteredDocs.forEach((doc: any) => {
                  if (doc.items?.item && Array.isArray(doc.items.item)) {
                    doc.items.item = doc.items.item.filter((subItem: any) => {
                      const subTitle = subItem.text?.["$"] || subItem.text;
                      return !HIDDEN_MENUS.includes(subTitle);
                    });
                  }
                });

                console.log("מערך התפריטים אחרי הסינון:", filteredDocs);

                // עדכון המבנה החדש
                menuData.data.menuDoc = filteredDocs;
              }

              setAppData({ menu: menuData });
            }
          }
        }
      } catch (error) {
        console.error("Initialization error:", error);
        setServerError("שרת הנתונים אינו זמין כרגע. אנא נסו שוב מאוחר יותר.");
      } finally {
        setIsInitializing(false);
      }
    };

    initApp();
  }, []);

  // --- תנאי רינדור 1: מסך רענון חוסם (Restart) ---
  if (needsReload) {
    return (
      <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/90 backdrop-blur-md" dir="rtl">
        <div className="bg-white p-10 rounded-2xl shadow-2xl max-w-md text-center border-t-8 border-orange-500">
          <div className="w-20 h-20 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={40} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-3">דרוש רענון מערכת</h2>
          <p className="text-slate-600 mb-8 leading-relaxed">
            נערכו שינויים בקונפיגורציה. יש לסגור את החלון ולפתוח את האפליקציה בחלון חדש, על מנת לראות את השינויים.
          </p>
          <button
            onClick={() => {
              sessionStorage.clear(); // מחיקת המשתמש והטוקן הישן
              localStorage.clear();   // ליתר ביטחון, אם נשמרו נתונים אחרים
              window.location.href = "/"; // טעינה מחדש למסך ה-Login
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95"
          >
            <LogOut size={22} />
            התחברות מחדש למערכת
          </button>
        </div>
      </div>
    );
  }
  if (serverError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
        <div className="max-w-md w-full bg-white rounded-xl shadow-2xl p-8 text-center border-t-4 border-red-500">
          <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="text-red-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">תקלת תקשורת</h1>
          <p className="text-slate-600 mb-6">{serverError}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-slate-800 text-white py-2 rounded-lg font-bold hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} />
            ניסיון התחברות מחודש
          </button>
        </div>
      </div>
    );
  }
  // --- תנאי רינדור 2: טעינה ראשונית ---
  if (isInitializing) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-slate-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
        <p className="mt-4 text-slate-600 font-bold font-sans" dir="rtl">טוען נתונים...</p>
      </div>
    );
  }

  // --- רינדור האפליקציה ---
  return (
    <BrowserRouter>
      <Toaster />
      <Sonner
        dir="rtl"
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{
          duration: 10000, // הארכה ל-6 שניות (במקום 4)
          style: {
            fontSize: '14px',
          },
        }}
      />

      {isLoginRequired && !currentUser ? (
        <LoginModal onSuccess={(user) => setCurrentUser(user)} />
      ) : (
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <AppHeader />
          <main className="flex-1 overflow-auto">
            <Routes>
              {/* שינוי מסך הבית הראשי לסיכום פעילות */}
              <Route path="/" element={<SummaryActivities />} />

              <Route path="/view-processes" element={<ProcessManagement mode="VIEW" />} />
              <Route path="/manage-processes" element={<ProcessManagement mode="MANAGE" />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/dnRouteNumbers" element={<DnRouteNumbers />} />
              <Route path="/NumberingPlan" element={<NumberingPlan />} />
              <Route path="/GetEventList" element={<GetEventList />} />
              <Route path="/GetMessages" element={<GetMessages />} />
              <Route path="/NumberInquiry" element={<NumberInquiry />} />
              <Route path="/HousekeepingScheduler" element={<HousekeepingScheduler />} />
              <Route path="/OperatorManagement" element={<OperatorManagement />} />
              <Route path="/NPGControlTower" element={<NPGControlTower />} />
              <Route path="/SummaryActivities" element={<SummaryActivities />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      )}
    </BrowserRouter>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppProvider>
      <TooltipProvider>
        <AppContent />
      </TooltipProvider>
    </AppProvider>
  </QueryClientProvider>
);

export default App;