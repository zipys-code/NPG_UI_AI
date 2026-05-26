import React, { createContext, useContext, useState, useCallback } from 'react';

// הגדרת המבנה של המשתמש
interface User {
    name: string;
    roleId: string;
    token?: string;
}

interface AppContextType {
    lovs: any;
    menu: any;
    currentNetworkId: string;
    currentNetworkName: string;
    currentUser: User | null;
    setCurrentNetworkId: (id: string) => void;
    setCurrentNetworkName: (name: string) => void;
    setCurrentUser: (user: User | null) => void;
    setAppData: (data: { menu?: any; lovs?: any }) => void;
    token: string;
    setToken: (token: string) => void;
    roleId: string;
    setRoleId: (id: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
    const [lovs, setLovs] = useState<any>(null);
    const [menu, setMenu] = useState<any>(null);
    const [currentNetworkId, setCurrentNetworkId] = useState("322");
    const [currentNetworkName, setCurrentNetworkName] = useState("");
    const [token, setToken] = useState<string>("");
    const [roleId, setRoleId] = useState<string>("");

    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        const saved = sessionStorage.getItem("userData");
        return saved ? JSON.parse(saved) : null;
    });

    const setAppData = useCallback((data: { menu?: any; lovs?: any }) => {
        if (data.lovs) setLovs(data.lovs);
        if (data.menu) setMenu(data.menu);
    }, []);

    const updateCurrentUser = useCallback((user: User | null) => {
        setCurrentUser(user);
        if (user) {
            sessionStorage.setItem("userData", JSON.stringify(user));
            if (user.token) setToken(user.token);
            if (user.roleId) setRoleId(user.roleId);
        } else {
            sessionStorage.removeItem("userData");
            setToken("");
            setRoleId("");
        }
    }, []);

    const value = {
        token,
        setToken,
        roleId,
        setRoleId,
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