import { useCallback } from "react";
import { useMsal } from "@azure/msal-react";
import { apiTokenRequest } from "./authConfig";
import type { StreamEvent, StreamCallbacks } from "../types/streaming";

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


    /**
     * Stream chat response via SSE.
     * Returns an AbortController that can be used to cancel the stream.
     */
    const streamChat = useCallback(
        async (
            message: string,
            model: string,
            provider: string,
            conversationId: number | null,
            callbacks: StreamCallbacks
        ): Promise<AbortController> => {
            const token = await getAccessToken();
            
            if (!token) {
                callbacks.onError("Not authenticated. Please log in.");
                return new AbortController();
            }

            const params = new URLSearchParams({ message, model, provider });
            if (conversationId !== null) {
                params.append("conversation_id", conversationId.toString());
            }

            const url = `${API_BASE_URL}/chat/stream?${params.toString()}`;
            const abortController = new AbortController();

            try {
                const response = await fetch(url, {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        Accept: "text/event-stream",
                    },
                    signal: abortController.signal,
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    callbacks.onError(errorText || `Stream failed with status ${response.status}`);
                    return abortController;
                }

                const reader = response.body?.getReader();
                if (!reader) {
                    callbacks.onError("Failed to get response stream");
                    return abortController;
                }

                const decoder = new TextDecoder();
                let buffer = "";

                // Process stream
                const processStream = async () => {
                    try {
                        while (true) {
                            const { done, value } = await reader.read();
                            
                            if (done) {
                                break;
                            }

                            buffer += decoder.decode(value, { stream: true });
                            
                            // Process complete SSE events (separated by double newline)
                            const events = buffer.split("\n\n");
                            buffer = events.pop() || ""; // Keep incomplete event in buffer

                            for (const eventStr of events) {
                                if (!eventStr.trim()) continue;
                                
                                // Parse SSE format: "data: {...}"
                                const dataMatch = eventStr.match(/^data:\s*(.+)$/m);
                                if (!dataMatch) continue;

                                try {
                                    const event: StreamEvent = JSON.parse(dataMatch[1]);
                                    handleStreamEvent(event, callbacks);
                                } catch (parseError) {
                                    console.error("[streamChat] Failed to parse event:", dataMatch[1], parseError);
                                }
                            }
                        }
                    } catch (error) {
                        if (error instanceof Error && error.name === 'AbortError') {
                            console.log("[streamChat] Stream aborted by user");
                        } else {
                            console.error("[streamChat] Stream error:", error);
                            callbacks.onError(error instanceof Error ? error.message : "Stream error");
                        }
                    }
                };

                // Start processing (don't await - let it run in background)
                processStream();

            } catch (error) {
                if (error instanceof Error && error.name === 'AbortError') {
                    console.log("[streamChat] Request aborted");
                } else {
                    callbacks.onError(error instanceof Error ? error.message : "Connection error");
                }
            }

            return abortController;
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
        streamChat,
        get,
        post,
        put,
        patch,
        delete: del,
    };
}


/**
 * Route stream events to appropriate callbacks
 */
function handleStreamEvent(event: StreamEvent, callbacks: StreamCallbacks): void {
    switch (event.type) {
        case 'meta':
            callbacks.onMeta(event.conversation_id);
            break;
        case 'thinking_start':
            callbacks.onThinkingStart();
            break;
        case 'thinking':
            callbacks.onThinking(event.text);
            break;
        case 'thinking_end':
            callbacks.onThinkingEnd();
            break;
        case 'content':
            callbacks.onContent(event.text);
            break;
        case 'tool_start':
            callbacks.onToolStart(event.name);
            break;
        case 'tool_end':
            callbacks.onToolEnd(event.name, event.result);
            break;
        case 'stream_end':
            callbacks.onStreamEnd(event.conversation_id, event.title);
            break;
        case 'error':
            callbacks.onError(event.message);
            break;
        // Ignore: content_start, content_end, done (internal events)
    }
}
