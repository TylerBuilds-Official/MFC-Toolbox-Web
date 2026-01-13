import type { Message } from "./message";


export type MessageStatus = 'sending' | 'streaming' | 'sent' | 'failed';

/** Content block types for interleaved rendering */
export type ContentBlock = 
    | { type: 'text'; content: string }
    | { type: 'thinking'; content: string; isStreaming?: boolean }
    | { type: 'tool_call'; name: string; params?: Record<string, unknown>; result?: string; isComplete?: boolean };

export type DisplayMessage = {
    id: number;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    status?: MessageStatus;
    error?: string;
    thinking?: string;              // Legacy: all thinking concatenated
    contentBlocks?: ContentBlock[]; // New: ordered blocks for inline rendering
}

export interface ChatWindowProps {
    externalPrompt?: string | null;
    onPromptConsumed?: () => void;
    activeConversationId: number | null;
    activeProjectId?: number | null;
    initialMessages: Message[];
    onConversationCreated: (id: number) => void;
    onMessagesUpdated?: (messages: Message[]) => void;
    // Model state (lifted from useChatModel)
    selectedModel: string;
    currentProvider: string;
    onModelChange: (model: string) => void;
    isModelReady: boolean;
}

export interface StreamingState {
    isStreaming: boolean;
    isTyping: boolean;
    streamingMessageId: number | null;
    streamingContent: string;
    thinkingContent: string;
    isThinkingActive: boolean;
}

export interface EditingState {
    editingMessageId: number | null;
    editedContent: string;
}

export interface CommandMenuState {
    showCommandMenu: boolean;
    commandSearch: string;
}

export interface ChatModelState {
    selectedModel: string;
    currentProvider: 'openai' | 'anthropic';
}
