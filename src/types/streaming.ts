/**
 * Types for SSE streaming events from /chat/stream endpoint
 */

export type StreamEventType = 
    | 'meta'
    | 'thinking_start'
    | 'thinking'
    | 'thinking_end'
    | 'content_start'
    | 'content'
    | 'content_end'
    | 'tool_start'
    | 'tool_end'
    | 'done'
    | 'stream_end'
    | 'error';

export interface MetaEvent {
    type: 'meta';
    conversation_id: number;
}

export interface ThinkingStartEvent {
    type: 'thinking_start';
}

export interface ThinkingEvent {
    type: 'thinking';
    text: string;
}

export interface ThinkingEndEvent {
    type: 'thinking_end';
}

export interface ContentStartEvent {
    type: 'content_start';
}

export interface ContentEvent {
    type: 'content';
    text: string;
}

export interface ContentEndEvent {
    type: 'content_end';
}

export interface ToolStartEvent {
    type: 'tool_start';
    name: string;
}

export interface ToolEndEvent {
    type: 'tool_end';
    name: string;
    result: string;
}

export interface DoneEvent {
    type: 'done';
    full_response: string;
    full_thinking?: string;
}

export interface StreamEndEvent {
    type: 'stream_end';
    conversation_id: number;
    title?: string;
}

export interface ErrorEvent {
    type: 'error';
    message: string;
}

export type StreamEvent = 
    | MetaEvent
    | ThinkingStartEvent
    | ThinkingEvent
    | ThinkingEndEvent
    | ContentStartEvent
    | ContentEvent
    | ContentEndEvent
    | ToolStartEvent
    | ToolEndEvent
    | DoneEvent
    | StreamEndEvent
    | ErrorEvent;

export interface StreamCallbacks {
    onMeta: (conversationId: number) => void;
    onThinkingStart: () => void;
    onThinking: (text: string) => void;
    onThinkingEnd: () => void;
    onContent: (text: string) => void;
    onToolStart: (name: string) => void;
    onToolEnd: (name: string, result: string) => void;
    onStreamEnd: (conversationId: number, title?: string) => void;
    onError: (message: string) => void;
}
