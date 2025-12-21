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
// HELPER FUNCTIONS (exported for use in components)
// ============================================

export function transformOpenAITools(openAITools: OpenAITool[]): Tool[] {
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

export function formatToolName(name: string): string {
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
