const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

console.log("[API] Base URL:", API_BASE_URL);

// ============================================
// TYPE DEFINITIONS
// ============================================

export interface Settings {
    provider: string;
    default_model: string;
    openai_api_key: string | null;
    anthropic_api_key: string | null;
    auto_save_conversations: boolean;
    dark_mode: boolean;
    // Streaming & reasoning settings
    enable_streaming: boolean;
    enable_extended_thinking: boolean;
    openai_reasoning_effort: 'low' | 'medium' | 'high';
    anthropic_thinking_budget: number;
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
// HELPER FUNCTIONS (exported for use in components)
// ============================================

/**
 * Format a snake_case tool name to Title Case
 */
export function formatToolName(name: string): string {
    return name
        .split("_")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

// ============================================
// PUBLIC API - No authentication required
// ============================================

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
};
