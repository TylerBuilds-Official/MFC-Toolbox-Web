import { useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { apiTokenRequest } from "./authConfig";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export interface ApiError {
    status: number;
    message: string;
    isAuthError: boolean;
    isForbidden: boolean;
}

export function useApi() {
    const { instance, accounts } = useMsal();

    const getAccessToken = useCallback(async (): Promise<string | null> => {
        if (accounts.length === 0) {
            return null;
        }

        try {
            const tokenResponse = await instance.acquireTokenSilent({
                ...apiTokenRequest,
                account: accounts[0],
            });
            return tokenResponse.accessToken;
        } catch (error) {
            console.warn("[useApi] Silent token acquisition failed, trying popup");
            try {
                const tokenResponse = await instance.acquireTokenPopup(apiTokenRequest);
                return tokenResponse.accessToken;
            } catch (popupError) {
                console.error("[useApi] Token acquisition failed:", popupError);
                return null;
            }
        }
    }, [instance, accounts]);

    const fetchWithAuth = useCallback(
        async <T>(
            endpoint: string,
            options: RequestInit = {}
        ): Promise<T> => {
            const token = await getAccessToken();
            
            if (!token) {
                throw {
                    status: 401,
                    message: "Not authenticated. Please log in.",
                    isAuthError: true,
                    isForbidden: false,
                } as ApiError;
            }

            const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
            
            const response = await fetch(url, {
                ...options,
                headers: {
                    ...options.headers,
                    Authorization: `Bearer ${token}`,
                },
                signal: options.signal,
            });

            // Response Error handling

            if (response.status === 401) {
                throw {
                    status: 401,
                    message: "Session expired. Please log in again.",
                    isAuthError: true,
                    isForbidden: false,
                } as ApiError;
            }

            if (response.status === 403) {
                const errorText = await response.text();
                throw {
                    status: 403,
                    message: errorText || "Access denied. You don't have permission to access this resource.",
                    isAuthError: false,
                    isForbidden: true,
                } as ApiError;
            }

            if (response.status === 404) {
                throw {
                    status: 404,
                    message: "Resource not found.",
                    isAuthError: false,
                    isForbidden: false,
                } as ApiError;
            }

            if (response.status === 400) {
                const errorText = await response.text();
                throw {
                    status: 400,
                    message: errorText || "Invalid request parameters.",
                    isAuthError: false,
                    isForbidden: false,
                } as ApiError;
            }

            if (!response.ok) {
                const errorText = await response.text();
                throw {
                    status: response.status,
                    message: errorText || `Request failed with status ${response.status}`,
                    isAuthError: false,
                    isForbidden: false,
                } as ApiError;
            }

            // Handle empty responses
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                return response.json();
            }
            
            return {} as T;
        },
        [getAccessToken]
    );



    // Convenience methods for common HTTP verbs
    const get = useCallback(
        <T>(endpoint: string, options?: RequestInit) => fetchWithAuth<T>(endpoint, { method: "GET", ...options }),
        [fetchWithAuth]
    );


    const post = useCallback(
        <T>(endpoint: string, body?: unknown) =>
            fetchWithAuth<T>(endpoint, {
                method: "POST",
                headers: body ? { "Content-Type": "application/json" } : undefined,
                body: body ? JSON.stringify(body) : undefined,
            }),
        [fetchWithAuth]
    );


    const put = useCallback(
        <T>(endpoint: string, body?: unknown) =>
            fetchWithAuth<T>(endpoint, {
                method: "PUT",
                headers: body ? { "Content-Type": "application/json" } : undefined,
                body: body ? JSON.stringify(body) : undefined,
            }),
        [fetchWithAuth]
    );


    const patch = useCallback(
        <T>(endpoint: string, body?: unknown) =>
            fetchWithAuth<T>(endpoint, {
                method: "PATCH",
                headers: body ? { "Content-Type": "application/json" } : undefined,
                body: body ? JSON.stringify(body) : undefined,
            }),
        [fetchWithAuth]
    );


    const del = useCallback(
        <T>(endpoint: string) => fetchWithAuth<T>(endpoint, { method: "DELETE" }),
        [fetchWithAuth]
    );


    return {
        getAccessToken,
        fetchWithAuth,
        get,
        post,
        put,
        patch,
        delete: del,
    };
}
