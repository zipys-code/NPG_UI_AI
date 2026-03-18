// src/context/AppContext.tsx

import React, { createContext, useContext, useState, useCallback } from 'react';
import { GetLOVResponse } from '../types/lov';
import { GetMenuListResponse } from '../types/menu';

interface AppContextType {
    lovs: GetLOVResponse | null;
    menu: GetMenuListResponse | null;
    currentNetworkId: string | null;
    setAppData: (menuData: any, lovsData: any) => void;
    setCurrentNetworkId: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [lovs, setLovs] = useState<GetLOVResponse | null>(null);
    const [menu, setMenu] = useState<GetMenuListResponse | null>(null);
    const [currentNetworkId, setCurrentNetworkId] = useState<string | null>(null);

    const setAppData = useCallback((menuData: any, lovsData: any) => {
        console.log("!!! AppContext: setAppData called", { menuData, lovsData });
        if (menuData) setMenu(menuData);
        if (lovsData) setLovs(lovsData);
    }, []);

    const updateNetworkId = useCallback((id: string) => {
        console.log("!!! AppContext: currentNetworkId updated to:", id);
        setCurrentNetworkId(id);
    }, []);

    const value = {
        lovs,
        menu,
        currentNetworkId,
        setAppData,
        setCurrentNetworkId: updateNetworkId
    };

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    );
}

// שינוי צורת הייצוא ל-function רגילה כדי לעזור ל-Vite Fast Refresh
export function useApp() {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error("useApp must be used within AppProvider");
    }
    return context;
}