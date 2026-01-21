import { useCallback, useState, useEffect, useRef } from "react";
import type { Message } from "../../types/message";
import type { DisplayMessage, MessageStatus, ContentBlock } from "../../types/chat";
import { createWelcomeMessage } from "../../components/chat_window/constants";


/**
 * Parse content_blocks JSON string from API into ContentBlock array.
 * Returns undefined if parsing fails or no blocks present.
 */
function parseContentBlocks(contentBlocksJson?: string): ContentBlock[] | undefined {
    if (!contentBlocksJson) return undefined;
    
    try {
        const parsed = JSON.parse(contentBlocksJson);
        if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed as ContentBlock[];
        }
    } catch (e) {
        console.warn('[useChatMessages] Failed to parse content_blocks:', e);
    }
    return undefined;
}

/**
 * Convert a Message from API to DisplayMessage for rendering.
 */
function convertToDisplayMessage(msg: Message): DisplayMessage {
    return {
        id:            msg.id,
        role:          msg.role,
        content:       msg.content,
        timestamp:     msg.created_at,
        status:        'sent' as MessageStatus,
        thinking:      msg.thinking,
        contentBlocks: parseContentBlocks(msg.content_blocks)
    };
}


export function useChatMessages(
    initialMessages: Message[],
    activeConversationId: number | null,
    onConversationCreated: (id: number) => void,
    userName?: string
) {
    // Initialize with a user-aware welcome message
    const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>(() => [
        createWelcomeMessage(userName)
    ]);
    const [conversationId, setConversationId] = useState<number | null>(null);
    
    // Track which conversation we've loaded to detect initial vs subsequent loads
    const lastLoadedConversationId = useRef<number | null>(null);


    // Sync conversationId with activeConversationId prop
    useEffect(() => {
        setConversationId(activeConversationId);
    }, [activeConversationId]);


    // Update welcome message when userName becomes available (after auth loads)
    useEffect(() => {
        setDisplayMessages(prev => {
            // Only update if we're showing a welcome message (single assistant message, no conversation loaded)
            if (prev.length === 1 && prev[0].role === 'assistant' && activeConversationId === null) {
                return [createWelcomeMessage(userName)];
            }
            return prev;
        });
    }, [userName, activeConversationId]);


    // Convert and load initial messages when they change
    // Smart merging: preserve session messages (new messages sent during session)
    useEffect(() => {
        if (initialMessages.length > 0) {
            const isInitialLoad = lastLoadedConversationId.current !== activeConversationId;
            
            if (isInitialLoad) {
                // First load for this conversation - replace entirely
                const converted = initialMessages.map(convertToDisplayMessage);
                setDisplayMessages(converted);
                lastLoadedConversationId.current = activeConversationId;
            } else {
                // Subsequent load (e.g., loading older messages) - merge with session messages
                // Session messages are those with IDs higher than the max loaded ID
                // (they were added during the current session and haven't been reloaded)
                setDisplayMessages(prev => {
                    const maxLoadedId = Math.max(...initialMessages.map(m => m.id));
                    const sessionMessages = prev.filter(m => m.id > maxLoadedId);
                    const converted = initialMessages.map(convertToDisplayMessage);
                    return [...converted, ...sessionMessages];
                });
            }
        } else if (activeConversationId === null) {
            // New conversation - show welcome message
            setDisplayMessages([createWelcomeMessage(userName)]);
            lastLoadedConversationId.current = null;
        }
    }, [initialMessages, activeConversationId, userName]);


    const updateMessageStatus = useCallback((messageId: number, status: MessageStatus, error?: string) => {
        setDisplayMessages(prev => prev.map(msg =>
            msg.id === messageId ? { ...msg, status, error } : msg
        ));
    }, []);


    const updateMessageContent = useCallback((messageId: number, content: string, thinking?: string, contentBlocks?: ContentBlock[]) => {
        setDisplayMessages(prev => prev.map(msg =>
            msg.id === messageId 
                ? { 
                    ...msg, 
                    content, 
                    thinking: thinking || msg.thinking,
                    contentBlocks: contentBlocks || msg.contentBlocks
                } 
                : msg
        ));
    }, []);


    const addUserMessage = useCallback((content: string, id?: number): number => {
        const timestamp = Date.now();
        const messageId = id ?? timestamp;

        const userMessage: DisplayMessage = {
            id:        messageId,
            role:      'user',
            content,
            timestamp: new Date(timestamp).toISOString(),
            status:    'sending'
        };

        setDisplayMessages(prev => [...prev, userMessage]);
        return messageId;
    }, []);


    const addAssistantMessage = useCallback((id?: number): number => {
        const messageId = id ?? Date.now() + 1;

        const assistantMessage: DisplayMessage = {
            id:        messageId,
            role:      'assistant',
            content:   '',
            timestamp: new Date().toISOString(),
            status:    'streaming'
        };

        setDisplayMessages(prev => [...prev, assistantMessage]);
        return messageId;
    }, []);


    const removeMessage = useCallback((messageId: number) => {
        setDisplayMessages(prev => prev.filter(m => m.id !== messageId));
    }, []);


    const finalizeMessage = useCallback((
        messageId: number,
        content: string,
        thinking?: string,
        status: MessageStatus = 'sent',
        contentBlocks?: ContentBlock[]
    ) => {
        setDisplayMessages(prev => prev.map(msg =>
            msg.id === messageId
                ? { 
                    ...msg, 
                    status, 
                    content: content || msg.content, 
                    thinking: thinking || undefined,
                    contentBlocks: contentBlocks || msg.contentBlocks
                }
                : msg
        ));
    }, []);


    const clearMessages = useCallback(() => {
        setDisplayMessages([createWelcomeMessage(userName)]);
        setConversationId(null);
        lastLoadedConversationId.current = null;
        onConversationCreated(-1);
    }, [onConversationCreated, userName]);


    const truncateToIndex = useCallback((index: number) => {
        setDisplayMessages(prev => prev.slice(0, index));
    }, []);


    return {
        displayMessages,
        setDisplayMessages,
        conversationId,
        setConversationId,
        updateMessageStatus,
        updateMessageContent,
        addUserMessage,
        addAssistantMessage,
        removeMessage,
        finalizeMessage,
        clearMessages,
        truncateToIndex,
    };
}

export type UseChatMessagesReturn = ReturnType<typeof useChatMessages>;
