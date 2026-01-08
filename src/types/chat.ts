import type { Message } from "./message";


export type MessageStatus = 'sending' | 'streaming' | 'sent' | 'failed';

export type DisplayMessage = {
    id: number;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    status?: MessageStatus;
    error?: string;
    thinking?: string;
}

export interface ChatWindowProps {
    externalPrompt?: string | null;
    onPromptConsumed?: () => void;
    activeConversationId: number | null;
    activeProjectId?: number | null;
    initialMessages: Message[];
    onConversationCreated: (id: number) => void;
    onMessagesUpdated?: (messages: Message[]) => void;
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
