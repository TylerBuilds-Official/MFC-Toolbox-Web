import type { Message } from "./message.ts";

export interface Conversation {
    id: number;
    user_id: number;
    title: string;
    summary: string;
    last_message_preview: string | null;
    created_at: string;
    updated_at: string;
    is_active: boolean;
}

export interface ConversationWithMessages {
    conversation: Conversation;
    messages: Message[];
    conversation_provider: string | null;
    conversation_model: string | null;
}

export interface ConversationsResponse {
    conversations: Conversation[];
}

