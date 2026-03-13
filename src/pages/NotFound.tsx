import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, AlertCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4" dir="rtl">
      <div className="text-center max-w-sm">
        {/* אייקון ויזואלי */}
        <div className="flex justify-center mb-6">
          <div className="bg-amber-100 p-4 rounded-full">
            <AlertCircle size={40} className="text-amber-600" />
          </div>
        </div>

        {/* תוכן השגיאה */}
        <h1 className="mb-2 text-6xl font-black text-[#1A365D]">404</h1>
        <h2 className="mb-4 text-xl font-bold text-slate-800">הדף לא נמצא</h2>
        <p className="mb-8 text-sm text-slate-500 leading-relaxed">
          מצטערים, הדף שאתה מחפש אינו קיים או שהועבר לכתובת אחרת.
          <br />
          <span className="text-[10px] font-mono opacity-50">({location.pathname})</span>
        </p>

        {/* כפתור חזרה הביתה - שימוש ב-Link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 rounded-xl bg-[#1A365D] px-6 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-[#254a7c] active:scale-95"
        >
          <Home size={16} />
          חזרה לדף הבית
        </Link>
      </div>
    </div>
  );
};

export default NotFound;