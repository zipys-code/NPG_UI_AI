import React, { createContext, useContext, useState, useCallback } from 'react';

// הגדרת המבנה של המשתמש
interface User {
    name: string;
    roleId: string;
}

interface AppContextType {
    lovs: any;
    menu: any;
    currentNetworkId: string;
    currentNetworkName: string;
    currentUser: User | null;
    setAppData: (data: { menu: any; lovs: any }) => void; // עדכון ה-Interface לפרמטר אחד
    setCurrentNetworkId: (id: string) => void;
    setCurrentNetworkName: (name: string) => void;
    setCurrentUser: (user: User | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [lovs, setLovs] = useState<any>(null);
    const [menu, setMenu] = useState<any>(null);
    const [currentNetworkId, setCurrentNetworkId] = useState("320");
    const [currentNetworkName, setCurrentNetworkName] = useState("");

    // טעינת משתמש מ-LocalStorage אם קיים
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        const saved = localStorage.getItem("userData");
        return saved ? JSON.parse(saved) : null;
    });

    // --- התיקון הקריטי: מילוי הפונקציה ---
    const setAppData = useCallback((data: { menu: any; lovs: any }) => {
        if (data.lovs) {
            setLovs(data.lovs);
            console.log("LOVs updated in Context");
        }
        if (data.menu) {
            setMenu(data.menu);
            console.log("Menu updated in Context");
        }
    }, []);

    const updateCurrentUser = useCallback((user: User | null) => {
        setCurrentUser(user);
        if (user) {
            localStorage.setItem("userData", JSON.stringify(user));
        } else {
            localStorage.removeItem("userData");
        }
    }, []);

    const value = {
        lovs,
        menu,
        currentNetworkId,
        currentNetworkName,
        currentUser,
        setAppData,
        setCurrentNetworkId,
        setCurrentNetworkName,
        setCurrentUser: updateCurrentUser
    };

    return <AppContext.Provider value={value as AppContextType}>{children}</AppContext.Provider>;
}

export function useApp() {
    const context = useContext(AppContext);
    if (!context) throw new Error("useApp must be used within AppProvider");
    return context;
}