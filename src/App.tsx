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
import { Calendar } from "./components/Calendar";

import { AppProvider, useApp } from "@/context/AppContext";
import { fetchMenuList, fetchLOVs } from "@/services/api";

const queryClient = new QueryClient();

const AppContent = () => {
  const { setAppData } = useApp();
  const [isInitializing, setIsInitializing] = useState(true);
  const isLoginRequired = APP_CONFIG.LOGIN_REQUIRED === "Y";

  const checkSession = () => {
    if (!isLoginRequired) return true;
    const savedUser = sessionStorage.getItem("npg_user");
    const loginTime = sessionStorage.getItem("npg_login_time");
    if (!savedUser || !loginTime) return false;
    const currentTime = new Date().getTime();
    const elapsedMinutes = (currentTime - parseInt(loginTime)) / 1000 / 60;
    return elapsedMinutes <= (APP_CONFIG.SESSION_DURATION_MINUTES || 120);
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

        if (lovsData) {
          console.log("3. Updating Context with received data...");
          // שליחת אובייקט אחד בדיוק לפי ה-Interface החדש
          setAppData({ menu: menuData, lovs: lovsData });
        } else {
          console.warn("3. FAILED: LOV data is null");
        }

      } catch (error) {
        console.error("4. CRITICAL ERROR during init:", error);
      } finally {
        setIsInitializing(false);
        console.log("5. Initialization finished");
      }
    };

    initApp();
  }, [setAppData]);

  const handleLoginSuccess = (userData: any) => {
    sessionStorage.setItem("npg_user", JSON.stringify(userData));
    sessionStorage.setItem("npg_login_time", new Date().getTime().toString());
    setIsAuthenticated(true);
  };

  if (isInitializing) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 font-sans" dir="rtl">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-600 font-medium">טוען נתוני מערכת...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster />
      <Sonner
        dir="rtl"
        position="bottom-right"
        richColors
        toastOptions={{ style: { fontFamily: 'sans-serif' } }}
      />

      {!isAuthenticated && isLoginRequired && (
        <LoginModal onSuccess={handleLoginSuccess} />
      )}

      {(!isLoginRequired || isAuthenticated) && (
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <AppHeader />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<ProcessManagement mode="VIEW" />} />
              <Route path="/view-processes" element={<ProcessManagement mode="VIEW" />} />
              <Route path="/manage-processes" element={<ProcessManagement mode="MANAGE" />} />
              <Route path="/calendar" element={<Calendar />} />
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