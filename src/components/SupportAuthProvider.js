"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";

const AuthContext = createContext({
    isAuthenticated: false,
    isLoading: true,
    username: "",
    displayName: "",
    logout: () => { },
});

export const useAuth = () => useContext(AuthContext);

export function SupportAuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [username, setUsername] = useState("");
    const [displayName, setDisplayName] = useState("");
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await fetch("/api/auth/check");
                const data = await res.json();
                setIsAuthenticated(data.authenticated);
                setUsername(data.username || "");
                setDisplayName(data.name || data.username || "");
            } catch {
                setIsAuthenticated(false);
            } finally {
                setIsLoading(false);
            }
        };
        checkAuth();
    }, [pathname]);

    const logout = async () => {
        try {
            await fetch("/api/auth/login", { method: "DELETE" });
        } catch {
            // ignore
        }
        setIsAuthenticated(false);
        setUsername("");
        setDisplayName("");
        router.push("/login");
        router.refresh();
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, username, displayName, logout }}>
            {children}
        </AuthContext.Provider>
    );
}
