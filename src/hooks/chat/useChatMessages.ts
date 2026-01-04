import { useCallback, useState, useEffect } from "react";
import type { Message } from "../../types/message";
import type { DisplayMessage, MessageStatus } from "../../types/chat";
import { WELCOME_MESSAGE } from "../../components/chat_window/constants";


export function useChatMessages(
    initialMessages: Message[],
    activeConversationId: number | null,
    onConversationCreated: (id: number) => void
) {
    const [displayMessages, setDisplayMessages] = useState<DisplayMessage[]>([WELCOME_MESSAGE]);
    const [conversationId, setConversationId]   = useState<number | null>(null);


    // Sync conversationId with activeConversationId prop
    useEffect(() => {
        setConversationId(activeConversationId);
    }, [activeConversationId]);


    // Convert and load initial messages when they change
    useEffect(() => {
        if (initialMessages.length > 0) {
            const converted: DisplayMessage[] = initialMessages.map(msg => ({
                id:        msg.id,
                role:      msg.role,
                content:   msg.content,
                timestamp: msg.created_at,
                status:    'sent' as MessageStatus,
                thinking:  msg.thinking
            }));
            setDisplayMessages(converted);
        } else if (activeConversationId === null) {
            setDisplayMessages([{
                ...WELCOME_MESSAGE,
                id:        Date.now(),
                timestamp: new Date().toISOString()
            }]);
        }
    }, [initialMessages, activeConversationId]);


    const updateMessageStatus = useCallback((messageId: number, status: MessageStatus, error?: string) => {
        setDisplayMessages(prev => prev.map(msg =>
            msg.id === messageId ? { ...msg, status, error } : msg
        ));
    }, []);


    const updateMessageContent = useCallback((messageId: number, content: string, thinking?: string) => {
        setDisplayMessages(prev => prev.map(msg =>
            msg.id === messageId ? { ...msg, content, thinking: thinking || msg.thinking } : msg
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
        status: MessageStatus = 'sent'
    ) => {
        setDisplayMessages(prev => prev.map(msg =>
            msg.id === messageId
                ? { ...msg, status, content: content || msg.content, thinking: thinking || undefined }
                : msg
        ));
    }, []);


    const clearMessages = useCallback(() => {
        setDisplayMessages([{
            ...WELCOME_MESSAGE,
            id:        Date.now(),
            timestamp: new Date().toISOString()
        }]);
        setConversationId(null);
        onConversationCreated(-1);
    }, [onConversationCreated]);


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
