import {type Tool, type ToolParameter } from "../types/tools";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

console.log("[API] Base URL:", API_BASE_URL);

// Raw OpenAI tool schema from backend
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

// Transform OpenAI tool schema to frontend Tool format
function transformOpenAITools(openAITools: OpenAITool[]): Tool[] {
    return openAITools.map(tool => {
        const fn = tool.function;
        const properties = fn.parameters?.properties || {};
        const required = fn.parameters?.required || [];

        // Convert properties to our ToolParameter format
        const parameters: ToolParameter[] = Object.entries(properties).map(
            ([name, prop]) => ({
                name,
                type: prop.type === "number" ? "number" : "string",
                required: required.includes(name),
                description: prop.description
            })
        );

        // Build a default prompt with placeholders for parameters
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

// Convert snake_case to Title Case
function formatToolName(name: string): string {
    return name
        .split("_")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

// Generate a natural language prompt from tool name
function generateDefaultPrompt(name: string): string {
    const prompts: Record<string, string> = {
        "get_job_info": "Get the details for job",
        "get_all_job_info": "List all jobs",
    };
    return prompts[name] || formatToolName(name);
}

export const chatApi = {
    sendMessage: async (message: string): Promise<string> => {
        const url = `${API_BASE_URL}/chat?message=${encodeURIComponent(message)}`;
        console.log("[API] Sending request to:", url);
        
        try {
            const response = await fetch(url);
            console.log("[API] Response status:", response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error("[API] Error response:", errorText);
                throw new Error(`Chat request failed! status: ${response.status}`);
            }
            
            const data = await response.json();
            console.log("[API] Response data:", data);
            return data.response;
        } catch (error) {
            console.error("[API] Fetch error:", error);
            throw error;
        }
    },

    resetConversation: async (): Promise<void> => {
        console.log("[API] Resetting conversation");
        await fetch(`${API_BASE_URL}/reset`, { method: "POST" });
    },

    getTools: async (): Promise<Tool[]> => {
        console.log("[API] Fetching tools");
        try {
            const response = await fetch(`${API_BASE_URL}/tools`);
            if (!response.ok) {
                throw new Error(`Failed to fetch tools: ${response.status}`);
            }
            const data: ToolsApiResponse = await response.json();
            console.log("[API] Raw tools received:", data.open_ai_tools);
            
            const tools = transformOpenAITools(data.open_ai_tools || []);
            console.log("[API] Transformed tools:", tools);
            return tools;
        } catch (error) {
            console.error("[API] Tools fetch error:", error);
            throw error;
        }
    }
};
