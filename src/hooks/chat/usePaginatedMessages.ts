import { useState, useCallback, useRef, useEffect } from 'react';
import type { Message } from '../../types/message';
import type { PaginatedMessagesResponse } from '../../types/conversation';

interface UsePaginatedMessagesOptions {
    api: {
        get: <T>(url: string) => Promise<T>;
    };
    conversationId: number | null;
    initialMessages: Message[];
    initialHasMore: boolean;
    initialOldestId: number | null;
}

interface UsePaginatedMessagesReturn {
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    hasMore: boolean;
    isLoadingMore: boolean;
    oldestLoadedId: number | null;
    totalCount: number | null;
    loadOlderMessages: () => Promise<void>;
    prependMessages: (newMessages: Message[]) => void;
    appendMessage: (message: Message) => void;
    resetPagination: (messages: Message[], hasMore: boolean, oldestId: number | null, totalCount?: number) => void;
}

export function usePaginatedMessages({
    api,
    conversationId,
    initialMessages,
    initialHasMore,
    initialOldestId,
}: UsePaginatedMessagesOptions): UsePaginatedMessagesReturn {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [hasMore, setHasMore] = useState(initialHasMore);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [oldestLoadedId, setOldestLoadedId] = useState<number | null>(initialOldestId);
    const [totalCount, setTotalCount] = useState<number | null>(null);
    
    // Track if we're currently loading to prevent duplicate requests
    const loadingRef = useRef(false);

    // Reset state when conversation changes
    useEffect(() => {
        setMessages(initialMessages);
        setHasMore(initialHasMore);
        setOldestLoadedId(initialOldestId);
        setIsLoadingMore(false);
        loadingRef.current = false;
    }, [conversationId, initialMessages, initialHasMore, initialOldestId]);

    const loadOlderMessages = useCallback(async () => {
        // Guards
        if (!conversationId || !hasMore || loadingRef.current || isLoadingMore) {
            return;
        }

        loadingRef.current = true;
        setIsLoadingMore(true);

        try {
            const params = new URLSearchParams({ limit: '50' });
            if (oldestLoadedId) {
                params.set('before_id', oldestLoadedId.toString());
            }

            const response = await api.get<PaginatedMessagesResponse>(
                `/conversations/${conversationId}/messages?${params}`
            );

            if (response.messages.length > 0) {
                // Prepend older messages (they come in chronological order)
                setMessages(prev => [...response.messages, ...prev]);
                setOldestLoadedId(response.oldest_id);
            }
            
            setHasMore(response.has_more);
            setTotalCount(response.total_count);
        } catch (error) {
            console.error('[usePaginatedMessages] Failed to load older messages:', error);
        } finally {
            setIsLoadingMore(false);
            loadingRef.current = false;
        }
    }, [api, conversationId, hasMore, oldestLoadedId, isLoadingMore]);

    const prependMessages = useCallback((newMessages: Message[]) => {
        setMessages(prev => [...newMessages, ...prev]);
    }, []);

    const appendMessage = useCallback((message: Message) => {
        setMessages(prev => [...prev, message]);
    }, []);

    const resetPagination = useCallback((
        newMessages: Message[], 
        newHasMore: boolean, 
        newOldestId: number | null,
        newTotalCount?: number
    ) => {
        setMessages(newMessages);
        setHasMore(newHasMore);
        setOldestLoadedId(newOldestId);
        if (newTotalCount !== undefined) {
            setTotalCount(newTotalCount);
        }
        loadingRef.current = false;
        setIsLoadingMore(false);
    }, []);

    return {
        messages,
        setMessages,
        hasMore,
        isLoadingMore,
        oldestLoadedId,
        totalCount,
        loadOlderMessages,
        prependMessages,
        appendMessage,
        resetPagination,
    };
}

export type { UsePaginatedMessagesReturn };
