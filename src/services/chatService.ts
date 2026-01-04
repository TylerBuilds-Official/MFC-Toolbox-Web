import type { Message } from "../types/message";
import type { DisplayMessage, MessageStatus } from "../types/chat";
import { WELCOME_MESSAGE } from "../components/chat_window/constants";


// ============================================================================
// Pure Utility Functions
// ============================================================================

/**
 * Format a timestamp to a localized time string
 */
export function formatMessageTime(timestamp: string): string {
    return new Date(timestamp).toLocaleTimeString([], {
        hour:   '2-digit',
        minute: '2-digit'
    });
}


/**
 * Convert backend Message[] to frontend DisplayMessage[]
 */
export function convertMessagesToDisplay(messages: Message[]): DisplayMessage[] {
    return messages.map(msg => ({
        id:        msg.id,
        role:      msg.role,
        content:   msg.content,
        timestamp: msg.created_at,
        status:    'sent' as MessageStatus,
        thinking:  msg.thinking
    }));
}


/**
 * Create a new user message
 */
export function createUserMessage(content: string, id?: number): DisplayMessage {
    const timestamp = Date.now();
    return {
        id:        id ?? timestamp,
        role:      'user',
        content,
        timestamp: new Date(timestamp).toISOString(),
        status:    'sending'
    };
}


/**
 * Create a new assistant message placeholder
 */
export function createAssistantMessage(id?: number): DisplayMessage {
    return {
        id:        id ?? Date.now() + 1,
        role:      'assistant',
        content:   '',
        timestamp: new Date().toISOString(),
        status:    'streaming'
    };
}


/**
 * Create a fresh welcome message with current timestamp
 */
export function createWelcomeMessage(): DisplayMessage {
    return {
        ...WELCOME_MESSAGE,
        id:        Date.now(),
        timestamp: new Date().toISOString()
    };
}


/**
 * Check if a model is from Anthropic
 */
export function isAnthropicModel(model: string): boolean {
    return model.startsWith("claude");
}


/**
 * Check if a model is from OpenAI
 */
export function isOpenAIModel(model: string): boolean {
    return model.startsWith("gpt");
}


/**
 * Infer provider from model name
 */
export function inferProvider(model: string, fallback: string = "openai"): string {
    if (isAnthropicModel(model)) return "anthropic";
    if (isOpenAIModel(model))    return "openai";
    return fallback;
}
