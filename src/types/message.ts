
export interface Message {
    id: number;
    conversation_id: number;
    role: "user" | "assistant";
    content: string;
    model: string;
    provider: string;
    tokens_used: number | null;
    created_at: string;
    thinking?: string;  // Extended thinking content (Claude only)
}
