export interface ToolParameter {
    name: string;
    type: "string" | "number";
    required: boolean;
    description?: string;
}

export interface Tool {
    id: string;
    name: string;
    description: string;
    prompt: string;
    icon?: string;
    parameters: ToolParameter[];
}
