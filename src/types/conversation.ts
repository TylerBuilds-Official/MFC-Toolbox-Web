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
    // Pagination info
    has_more: boolean;
    oldest_id: number | null;
    total_count: number;
}

export interface PaginatedMessagesResponse {
    messages: Message[];
    has_more: boolean;
    oldest_id: number | null;
    total_count: number;
}

export interface ConversationsResponse {
    conversations: Conversation[];
}
