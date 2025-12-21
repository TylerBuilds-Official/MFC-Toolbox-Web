import {type Tool, type ToolParameter } from "../types/tools";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

console.log("[API] Base URL:", API_BASE_URL);

// ============================================
// TYPE DEFINITIONS
// ============================================

interface OpenAIToolParameter {
    type: string;
    description?: string;
}

interface OpenAITool {
    type: "function";
    function: {
        name: string;
        description: string;
        parameters: {
            type: "object";
            properties: Record<string, OpenAIToolParameter>;
            required: string[];
        };
    };
}

interface ToolsApiResponse {
    open_ai_tools: OpenAITool[];
}

export interface Settings {
    provider: string;
    default_model: string;
    openai_api_key: string | null;
    anthropic_api_key: string | null;
    auto_save_conversations: boolean;
    dark_mode: boolean;
}

export interface ProviderInfo {
    provider: string;
    default_model: string;
}

export interface ModelsResponse {
    models: {
        openai_models: string[];
        claude_models: string[];
    };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function transformOpenAITools(openAITools: OpenAITool[]): Tool[] {
    return openAITools.map(tool => {
        const fn = tool.function;
        const properties = fn.parameters?.properties || {};
        const required = fn.parameters?.required || [];

        const parameters: ToolParameter[] = Object.entries(properties).map(
            ([name, prop]) => ({
                name,
                type: prop.type === "number" ? "number" : "string",
                required: required.includes(name),
                description: prop.description
            })
        );

        let prompt: string;
        if (parameters.length === 0) {
            prompt = generateDefaultPrompt(fn.name);
        } else {
            const paramPlaceholders = parameters.map(p => `{${p.name}}`).join(", ");
            prompt = `${generateDefaultPrompt(fn.name)} ${paramPlaceholders}`;
        }

        return {
            id: fn.name,
            name: formatToolName(fn.name),
            description: fn.description,
            prompt,
            parameters
        };
    });
}

function formatToolName(name: string): string {
    return name
        .split("_")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

function generateDefaultPrompt(name: string): string {
    const prompts: Record<string, string> = {
        "get_job_info": "Get the details for job",
        "get_all_job_info": "List all jobs",
    };
    return prompts[name] || formatToolName(name);
}


// API Factory for authenticated endpoints
export function createAuthenticatedApi(getToken: () => Promise<string | null>) {
    const authFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
        const token = await getToken();
        const headers: HeadersInit = {
            ...options.headers,
        };
        
        if (token) {
            (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
        }
        
        return fetch(url, { ...options, headers });
    };

    return {
    // Chat Endpoints (requires authentication)
        sendMessage: async (message: string, model?: string, provider?: string): Promise<string> => {
            let url = `${API_BASE_URL}/chat?message=${encodeURIComponent(message)}`;
            if (model) url += `&model=${encodeURIComponent(model)}`;
            if (provider) url += `&provider=${encodeURIComponent(provider)}`;
            
            console.log("[API] Sending authenticated request to:", url);
            
            const response = await authFetch(url);
            console.log("[API] Response status:", response.status);
            
            if (response.status === 401) {
                throw new Error("Session expired. Please log in again.");
            }
            
            if (response.status === 403) {
                throw new Error("Access denied. Your account may not be activated.");
            }
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error("[API] Error response:", errorText);
                throw new Error(`Chat request failed! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log("[API] Response data:", data);
            return data.response;
        },

        resetConversation: async (): Promise<void> => {
            console.log("[API] Resetting conversation");
            const response = await authFetch(`${API_BASE_URL}/reset`, { method: "POST" });
            if (!response.ok) {
                throw new Error(`Failed to reset conversation: ${response.status}`);
            }
        },

    // Protected Settings Endpoints
        getSettings: async (): Promise<Settings> => {
            console.log("[API] Fetching settings");
            const response = await authFetch(`${API_BASE_URL}/settings`);
            if (!response.ok) {
                throw new Error(`Failed to fetch settings: ${response.status}`);
            }
            const data = await response.json();
            console.log("[API] Settings received:", data);
            return data;
        },

        updateSettings: async (settings: Partial<Settings>): Promise<void> => {
            console.log("[API] Updating settings:", settings);
            const response = await authFetch(`${API_BASE_URL}/settings`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(settings)
            });
            if (!response.ok) {
                throw new Error(`Failed to update settings: ${response.status}`);
            }
            console.log("[API] Settings updated successfully");
        },

        getProvider: async (): Promise<ProviderInfo> => {
            console.log("[API] Fetching provider");
            const response = await authFetch(`${API_BASE_URL}/settings/provider`);
            if (!response.ok) {
                throw new Error(`Failed to fetch provider: ${response.status}`);
            }
            const data = await response.json();
            console.log("[API] Provider received:", data);
            return data;
        },

        setProvider: async (provider: string, defaultModel?: string): Promise<ProviderInfo> => {
            console.log("[API] Setting provider:", provider, defaultModel);
            let url = `${API_BASE_URL}/settings/provider?provider=${provider}`;
            if (defaultModel) url += `&default_model=${defaultModel}`;
            
            const response = await authFetch(url, { method: "POST" });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to set provider: ${response.status} - ${errorText}`);
            }
            const data = await response.json();
            console.log("[API] Provider set successfully:", data);
            return data;
        },

    // Admin endpoints (requires admin privileges)
        getUsers: async () => {
            console.log("[API] Fetching all users (admin)");
            const response = await authFetch(`${API_BASE_URL}/admin/users`);
            if (response.status === 403) {
                throw new Error("Access denied. Admin privileges required.");
            }
            if (!response.ok) {
                throw new Error(`Failed to fetch users: ${response.status}`);
            }
            return response.json();
        },

        setUserRole: async (userId: string, role: string) => {
            console.log("[API] Setting user role (admin):", userId, role);
            const response = await authFetch(
                `${API_BASE_URL}/admin/users/${userId}/role?role=${role}`,
                { method: "POST" }
            );
            if (response.status === 403) {
                throw new Error("Access denied. Admin privileges required.");
            }
            if (!response.ok) {
                throw new Error(`Failed to set user role: ${response.status}`);
            }
            return response.json();
        },
    };
}

// Public Endpoints - No authentication required
export const publicApi = {
    healthCheck: async (): Promise<boolean> => {
        try {
            const response = await fetch(`${API_BASE_URL}/`);
            return response.ok;
        } catch {
            return false;
        }
    },

    getModels: async (): Promise<ModelsResponse> => {
        console.log("[API] Fetching models");
        const response = await fetch(`${API_BASE_URL}/models`);
        if (!response.ok) {
            throw new Error(`Failed to fetch models: ${response.status}`);
        }
        const data = await response.json();
        console.log("[API] Models received:", data);
        return data;
    },

    getTools: async (): Promise<Tool[]> => {
        console.log("[API] Fetching tools");
        const response = await fetch(`${API_BASE_URL}/tools`);
        if (!response.ok) {
            throw new Error(`Failed to fetch tools: ${response.status}`);
        }
        const data: ToolsApiResponse = await response.json();
        console.log("[API] Raw tools received:", data.open_ai_tools);
        
        const tools = transformOpenAITools(data.open_ai_tools || []);
        console.log("[API] Transformed tools:", tools);
        return tools;
    }
};

// Legacy API

export const chatApi = {
    sendMessage: async (_message: string, _model?: string, _provider?: string): Promise<string> => {
        throw new Error("chatApi.sendMessage requires authentication. Use createAuthenticatedApi() instead.");
    },
    resetConversation: async (): Promise<void> => {
        throw new Error("chatApi.resetConversation requires authentication. Use createAuthenticatedApi() instead.");
    },
    getSettings: async (): Promise<Settings> => {
        throw new Error("chatApi.getSettings requires authentication. Use createAuthenticatedApi() instead.");
    },
    updateSettings: async (_settings: Partial<Settings>): Promise<void> => {
        throw new Error("chatApi.updateSettings requires authentication. Use createAuthenticatedApi() instead.");
    },
    getProvider: async (): Promise<ProviderInfo> => {
        throw new Error("chatApi.getProvider requires authentication. Use createAuthenticatedApi() instead.");
    },
    setProvider: async (_provider: string, _defaultModel?: string): Promise<ProviderInfo> => {
        throw new Error("chatApi.setProvider requires authentication. Use createAuthenticatedApi() instead.");
    },
    getModels: publicApi.getModels,
    getTools: publicApi.getTools
};
