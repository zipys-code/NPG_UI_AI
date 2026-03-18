import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState, useEffect } from "react";
import { APP_CONFIG } from "@/config";
import { LoginModal } from "@/components/LoginModal";
import AppHeader from "@/components/AppHeader";
import ProcessManagement from "./pages/ProcessManagement";
import NotFound from "./pages/NotFound.tsx";

// ייבוא ה-Context והשירותים
import { AppProvider, useApp } from "@/context/AppContext";
import { fetchMenuList, fetchLOVs } from "@/services/api";

const queryClient = new QueryClient();

const AppContent = () => {
  const { setAppData, lovs } = useApp();
  const [isInitializing, setIsInitializing] = useState(true);
  const isLoginRequired = APP_CONFIG.LOGIN_REQUIRED === "Y";

  const checkSession = () => {
    if (!isLoginRequired) return true;
    const savedUser = sessionStorage.getItem("npg_user");
    const loginTime = sessionStorage.getItem("npg_login_time");
    if (!savedUser || !loginTime) return false;
    const currentTime = new Date().getTime();
    const elapsedMinutes = (currentTime - parseInt(loginTime)) / 1000 / 60;
    if (elapsedMinutes > (APP_CONFIG.SESSION_DURATION_MINUTES || 120)) {
      sessionStorage.clear();
      return false;
    }
    return true;
  };

  const [isAuthenticated, setIsAuthenticated] = useState(checkSession());

  useEffect(() => {
    const initApp = async () => {
      try {
        console.log("1. Starting API calls...");
        const [menuData, lovsData] = await Promise.all([
          fetchMenuList(),
          fetchLOVs()
        ]);

        console.log("2. API Responses:", {
          menuSuccess: !!menuData,
          lovsSuccess: !!lovsData
        });

        // שינוי קריטי: ממשיכים אם ה-LOV הצליח, גם אם המנו נכשל (כי הוא יתוקן בהמשך)
        if (lovsData) {
          console.log("3. LOV loaded successfully. Updating Context...");
          setAppData(menuData, lovsData);
        } else {
          console.warn("3. FAILED: LOV is essential but returned null");
        }

      } catch (error) {
        console.error("4. CRITICAL ERROR during init:", error);
      } finally {
        console.log("5. Initialization sequence finished");
        setIsInitializing(false); // שחרור הספינר בכל מצב
      }
    };

    initApp();
  }, [setAppData]);

  const handleLoginSuccess = (userData: any) => {
    sessionStorage.setItem("npg_user", JSON.stringify(userData));
    sessionStorage.setItem("npg_login_time", new Date().getTime().toString());
    setIsAuthenticated(true);
  };

  // מציגים טעינה רק בזמן שהתהליך initApp רץ
  if (isInitializing) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 font-sans" dir="rtl">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-600 font-medium">טוען נתוני מערכת...</p>
      </div>
    );
  }

  return (
    <>
      <Toaster />
      <Sonner
        dir="rtl"
        position="bottom-right"
        expand={false}
        richColors
        toastOptions={{
          style: { fontFamily: 'system-ui, sans-serif' },
        }}
      />

      {/* המודאל יוצג אם המשתמש לא מחובר והאתחול הסתיים */}
      {!isAuthenticated && isLoginRequired && (
        <LoginModal onSuccess={handleLoginSuccess} />
      )}

      {(!isLoginRequired || isAuthenticated) && (
        <div className="min-h-screen bg-slate-50">
          <AppHeader />
          <main>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<ProcessManagement />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </main>
        </div>
      )}
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <TooltipProvider>
          <AppContent />
        </TooltipProvider>
      </AppProvider>
    </QueryClientProvider>
  );
};

export default App;