import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";
import { InteractionStatus } from "@azure/msal-browser";
import { loginRequest, apiTokenRequest } from "./authConfig";
import type {User} from "./types";
import type {AuthContextType} from "./types";


const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const { instance, inProgress, accounts } = useMsal();
    const isAuthenticated = useIsAuthenticated();
    
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUserInfo = useCallback(async () => {
        if (!isAuthenticated || accounts.length === 0) {
            setUser(null);
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            setError(null);

            // Get access token silently
            const tokenResponse = await instance.acquireTokenSilent({
                ...apiTokenRequest,
                account: accounts[0],
            });

            // Fetch user info from backend
            const response = await fetch(`${API_BASE_URL}/me`, {
                headers: {
                    Authorization: `Bearer ${tokenResponse.accessToken}`,
                },
            });

            if (response.status === 401) {
                // Token invalid, clear and re-authenticate
                setError("Session expired. Please log in again.");
                setUser(null);
                return;
            }

            if (response.status === 403) {
                const errorData = await response.json().catch(() => ({}));
                setError(errorData.detail || "Access denied. Your account may not be activated.");
                setUser(null);
                return;
            }

            if (!response.ok) {
                throw new Error(`Failed to fetch user info: ${response.status}`);
            }

            const userData: User = await response.json();
            setUser(userData);
        } catch (err) {
            console.error("[Auth] Error fetching user info:", err);
            setError(err instanceof Error ? err.message : "Authentication failed");
        } finally {
            setIsLoading(false);
        }
    }, [isAuthenticated, accounts, instance]);

    useEffect(() => {
        // Only fetch user info when not actively authenticating
        if (inProgress === InteractionStatus.None) {
            fetchUserInfo();
        }
    }, [inProgress, fetchUserInfo]);

    const login = useCallback(async () => {
        try {
            setError(null);
            console.log("[Auth] Starting popup login...");
            
            // Use popup with explicit request
            const response = await instance.loginPopup({
                ...loginRequest,
                prompt: "select_account",  // Force account selection
            });
            
            console.log("[Auth] Login successful:", response);
            
            // Fetch user info after successful login
            await fetchUserInfo();
        } catch (err) {
            console.error("[Auth] Login failed:", err);
            
            // Handle specific error cases
            if (err instanceof Error) {
                if (err.message.includes("popup_window_error")) {
                    setError("Popup was blocked. Please allow popups for this site.");
                } else if (err.message.includes("user_cancelled")) {
                    setError("Login was cancelled.");
                } else {
                    setError(err.message);
                }
            } else {
                setError("Login failed. Please try again.");
            }
        }
    }, [instance, fetchUserInfo, loginRequest]);

    const logout = useCallback(async () => {
        try {
            console.log("[Auth] Logging out...");
            await instance.logoutPopup({
                postLogoutRedirectUri: "/",
                mainWindowRedirectUri: "/",
            });
            setUser(null);
        } catch (err) {
            console.error("[Auth] Logout failed:", err);
            // Even if logout fails, clear local user state
            setUser(null);
        }
    }, [instance]);

    const refreshUser = useCallback(async () => {
        await fetchUserInfo();
    }, [fetchUserInfo]);

    const isPendingActivation = user !== null && !user.is_active;

    const value: AuthContextType = {
        user,
        isLoading: isLoading || inProgress !== InteractionStatus.None,
        error,
        isAuthenticated: isAuthenticated && user !== null,
        isPendingActivation,
        login,
        logout,
        refreshUser,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
