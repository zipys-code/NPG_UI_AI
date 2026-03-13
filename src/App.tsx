import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useState } from "react";
import { APP_CONFIG } from "@/config";
import { LoginModal } from "@/components/LoginModal";
import AppHeader from "@/components/AppHeader"; // ייבוא ה-Header
import ProcessManagement from "./pages/ProcessManagement"; // הדף החדש שלך
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => {
  const isLoginRequired = APP_CONFIG.LOGIN_REQUIRED === "Y";

  // בדיקה האם המשתמש מחובר (בודק את האובייקט npg_user)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (!isLoginRequired) return true;
    return sessionStorage.getItem("npg_user") !== null;
  });

  // פונקציית הצלחה בלוגין
  const handleLoginSuccess = (userData: { name: string; domain?: string }) => {
    sessionStorage.setItem("npg_user", JSON.stringify(userData));
    setIsAuthenticated(true);
    window.location.reload(); // רענון כדי לעדכן את ה-Header
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />

        {/* הצגת המודאל אם המשתמש לא מחובר */}
        {!isAuthenticated && isLoginRequired && (
          <LoginModal onSuccess={handleLoginSuccess} />
        )}

        {/* הצגת התוכן רק אם מחובר */}
        {isAuthenticated && (
          <div className="min-h-screen bg-slate-50">
            <AppHeader /> {/* ה-Header מופיע מעל הכל */}
            <main>
              <BrowserRouter>
                <Routes>
                  {/* דף הבית מציג כעת את ניהול התהליכים */}
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