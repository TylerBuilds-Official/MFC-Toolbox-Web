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

/**
 * Split camelCase or PascalCase string into readable words
 * "PiecesProcessed" → "Pieces Processed"
 * "totalOTHours" → "Total OT Hours"
 */
export function splitCamelCase(str: string): string {
    return str
        // Insert space before uppercase letters that follow lowercase
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        // Insert space before uppercase letters that are followed by lowercase (handles "OTHours" → "OT Hours")
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
        // Clean up any double spaces
        .replace(/\s+/g, ' ')
        .trim();
}

/**
 * Column Name Mapping - DB column names → Display names
 */
const COLUMN_NAME_MAP: Record<string, string> = {
    'CEMPID': 'Employee ID',
    'CFIRSTNAME': 'First Name',
    'CLASTNAME': 'Last Name',
};

/**
 * Format a column/field name for display - handles camelCase, PascalCase, and snake_case
 * "PiecesProcessed" → "Pieces Processed"
 * "job_number" → "Job Number"
 */
export function formatColumnName(value: string): string {
    if (!value) return '';

    if (value in COLUMN_NAME_MAP) {
        return COLUMN_NAME_MAP[value];
    }

    // Handle snake_case (convert to Title Case)
    if (value.includes('_')) {
        return formatToolName(value);
    }

    // Handle camelCase/PascalCase
    return splitCamelCase(value);
}

/**
 * Format axis tick values - handles dates and long strings
 * Compact format for chart axes (no year)
 */
export function formatTickValue(value: string): string {
    if (!value) return '';
    
    // Try to parse as ISO date (2025-01-15 or 2025-01-15T00:00:00)
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}/;
    if (isoDateRegex.test(value)) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
    }
    
    // Truncate long strings for tick display
    if (value.length > 15) {
        return value.substring(0, 12) + '...';
    }
    
    return value;
}

/**
 * Format date with year - for card/detail displays
 * "2025-01-15" → "Jan 15, 2025"
 */
function formatDateWithYear(value: string): string {
    if (!value) return '';
    
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}/;
    if (isoDateRegex.test(value)) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
            });
        }
    }
    
    return value;
}

export default formatDateWithYear

/**
 * Format full value for tooltips - more detailed than tick labels
 */
export function formatTooltipValue(value: string): string {
    if (!value) return '';
    
    // Try to parse as ISO date
    const isoDateRegex = /^\d{4}-\d{2}-\d{2}/;
    if (isoDateRegex.test(value)) {
        const date = new Date(value);
        if (!isNaN(date.getTime())) {
            return date.toLocaleDateString('en-US', { 
                weekday: 'short',
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
            });
        }
    }
    
    return value;
}

/**
 * Format numeric values for Y-axis (compact notation)
 * 1500 → "1.5K", 1500000 → "1.5M"
 */
export function formatYAxisValue(value: number): string {
    if (Math.abs(value) >= 1_000_000) {
        return (value / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (Math.abs(value) >= 1_000) {
        return (value / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return value.toLocaleString();
}

/**
 * PM Name Mapping - First names from DB → Full names
 */
const PM_NAME_MAP: Record<string, string> = {
    'Blake':     'Blake Reed',
    'Conrad':    'Conrad Schmidt',
    'Evan':      'Evan Weaver',
    'James':     'James',
    'Joe':       'Joe Lenoue',
    'Ken':       'Ken Bastine',
    'Matt Leon': 'Matt Leon',
    'Quintin':   'Quintin Porterfield',
    'Raymond':   'Raymond Rodriguez',
};

/**
 * Format PM name from DB first name to full name
 */
export function formatPMName(value: unknown): string {
    if (typeof value !== 'string') return String(value ?? '');
    const trimmed = value.trim();
    return PM_NAME_MAP[trimmed] || trimmed;
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
