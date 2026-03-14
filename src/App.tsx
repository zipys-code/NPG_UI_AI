import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState } from "react";
import { APP_CONFIG } from "@/config";
import { LoginModal } from "@/components/LoginModal";
import AppHeader from "@/components/AppHeader";
import ProcessManagement from "./pages/ProcessManagement";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => {
  const isLoginRequired = APP_CONFIG.LOGIN_REQUIRED === "Y";

  const checkSession = () => {
    if (!isLoginRequired) return true;

    const savedUser = sessionStorage.getItem("npg_user");
    const loginTime = sessionStorage.getItem("npg_login_time");

    if (!savedUser || !loginTime) return false;

    const currentTime = new Date().getTime();
    const elapsedMinutes = (currentTime - parseInt(loginTime)) / 1000 / 60;

    // בדיקה מול הערך ב-Config (דיפולט שעתיים)
    if (elapsedMinutes > (APP_CONFIG.SESSION_DURATION_MINUTES || 120)) {
      sessionStorage.clear();
      return false;
    }
    return true;
  };

  const [isAuthenticated, setIsAuthenticated] = useState(checkSession());

  const handleLoginSuccess = (userData: any) => {
    sessionStorage.setItem("npg_user", JSON.stringify(userData));
    sessionStorage.setItem("npg_login_time", new Date().getTime().toString());
    setIsAuthenticated(true);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner
          dir="rtl"
          position="bottom-right"
          expand={false}
          richColors // מאפשר צבעים עשירים מובנים (אדום לשגיאה, ירוק להצלחה)
          toastOptions={{
            // כאן אנחנו מגדירים סטייל שיחול על כל הודעות השגיאה באופן אוטומטי
            style: {
              fontFamily: 'system-ui, sans-serif',
            },
            // הגדרות ספציפיות לפי סוג ההודעה
            className: "my-toast-class",
          }}
        />

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
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;