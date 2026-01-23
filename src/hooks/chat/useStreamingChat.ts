import { useCallback, useState, useRef, useEffect } from "react";
import { useApi } from "../../auth";
import type { UseChatMessagesReturn } from "./useChatMessages";
import type { MessageStatus, ContentBlock } from "../../types/chat";

// Minimal model state needed for streaming
interface ChatModelState {
    selectedModel: string;
    currentProvider: string;
}


type ShowToastFn = (message: string, variant?: 'success' | 'error' | 'warning' | 'info', options?: { duration?: number; action?: { label: string; onClick: () => void } }) => void;

type SendMessageFn = (
    content: string,
    existingId?: number,
    simulateFailure?: boolean,
    skipUserMessage?: boolean
) => Promise<void>;


export function useStreamingChat(
    api: ReturnType<typeof useApi>,
    chatMessages: UseChatMessagesReturn,
    chatModel: ChatModelState,
    showToast: ShowToastFn,
    onConversationCreated: (id: number) => void,
    projectId?: number | null
) {
    // State
    const [isStreaming, setIsStreaming]             = useState(false);
    const [isTyping, setIsTyping]                   = useState(false);
    const [streamingMessageId, setStreamingMessageId] = useState<number | null>(null);
    const [streamingContent, setStreamingContent]   = useState("");
    const [thinkingContent, setThinkingContent]     = useState("");
    const [isThinkingActive, setIsThinkingActive]   = useState(false);
    const [isRegenerating, setIsRegenerating]       = useState(false);
    const [contentBlocks, setContentBlocks]         = useState<ContentBlock[]>([]);

    // Refs
    const thinkingContentRef  = useRef("");
    const streamingContentRef = useRef("");
    const contentBlocksRef    = useRef<ContentBlock[]>([]);
    const currentThinkingRef  = useRef<string>("");  // Current thinking block content
    const needsSpaceRef       = useRef(false);       // Track if next text needs leading space
    const abortControllerRef  = useRef<AbortController | null>(null);
    const sendMessageRef      = useRef<SendMessageFn>(null!);


    const resetStreamingState = useCallback(() => {
        setIsTyping(false);
        setIsStreaming(false);
        setStreamingMessageId(null);
        setStreamingContent("");
        setThinkingContent("");
        setIsThinkingActive(false);
        setContentBlocks([]);
        thinkingContentRef.current  = "";
        streamingContentRef.current = "";
        contentBlocksRef.current    = [];
        currentThinkingRef.current  = "";
        needsSpaceRef.current       = false;
        abortControllerRef.current  = null;
    }, []);


    const sendMessage = useCallback(async (
        messageContent: string,
        existingMessageId?: number,
        simulateFailure?: boolean,
        skipUserMessage?: boolean
    ) => {
        const timestamp          = Date.now();
        const userMessageId      = existingMessageId || timestamp;
        const assistantMessageId = timestamp + 1;

        // Add user message if needed
        if (existingMessageId) {
            chatMessages.updateMessageStatus(existingMessageId, 'sending', undefined);
        } else if (!skipUserMessage) {
            chatMessages.addUserMessage(messageContent, userMessageId);
        }

        // Add assistant message placeholder
        chatMessages.addAssistantMessage(assistantMessageId);

        // Set streaming state
        setIsTyping(true);
        setIsStreaming(true);
        setStreamingMessageId(assistantMessageId);
        setStreamingContent("");
        setThinkingContent("");
        setIsThinkingActive(false);
        setContentBlocks([]);
        thinkingContentRef.current  = "";
        streamingContentRef.current = "";
        contentBlocksRef.current    = [];
        currentThinkingRef.current  = "";
        needsSpaceRef.current       = false;

        // Handle simulated failure
        if (simulateFailure) {
            chatMessages.removeMessage(assistantMessageId);
            chatMessages.updateMessageStatus(userMessageId, 'failed', 'Simulated failure triggered by /fail');
            resetStreamingState();
            return;
        }

        try {
            const abortController = await api.streamChat(
                messageContent,
                chatModel.selectedModel,
                chatModel.currentProvider,
                chatMessages.conversationId,
                {
                    onMeta: (newConversationId) => {
                        if (newConversationId !== chatMessages.conversationId) {
                            chatMessages.setConversationId(newConversationId);
                            onConversationCreated(newConversationId);
                        }
                    },
                    onThinkingStart: () => {
                        setIsThinkingActive(true);
                        currentThinkingRef.current = "";
                        // Add a new thinking block
                        const newBlock: ContentBlock = { type: 'thinking', content: '', isStreaming: true };
                        contentBlocksRef.current = [...contentBlocksRef.current, newBlock];
                        setContentBlocks([...contentBlocksRef.current]);
                    },
                    onThinking: (text) => {
                        // Accumulate to legacy ref
                        thinkingContentRef.current += text;
                        setThinkingContent(thinkingContentRef.current);
                        
                        // Update current thinking block
                        currentThinkingRef.current += text;
                        const blocks = contentBlocksRef.current;
                        const lastBlock = blocks[blocks.length - 1];
                        if (lastBlock?.type === 'thinking') {
                            lastBlock.content = currentThinkingRef.current;
                            setContentBlocks([...blocks]);
                        }
                    },
                    onThinkingEnd: () => {
                        setIsThinkingActive(false);
                        needsSpaceRef.current = true;
                        
                        // Mark thinking block as complete
                        const blocks = contentBlocksRef.current;
                        const lastBlock = blocks[blocks.length - 1];
                        if (lastBlock?.type === 'thinking') {
                            lastBlock.isStreaming = false;
                            setContentBlocks([...blocks]);
                        }
                    },
                    onContent: (text) => {
                        // Add leading space if needed after thinking/tool
                        let textToAdd = text;
                        if (needsSpaceRef.current && text && !text.startsWith(' ') && !text.startsWith('\n')) {
                            textToAdd = ' ' + text;
                        }
                        needsSpaceRef.current = false;
                        
                        streamingContentRef.current += textToAdd;
                        setStreamingContent(streamingContentRef.current);
                        
                        // Update or create text block
                        const blocks = contentBlocksRef.current;
                        const lastBlock = blocks[blocks.length - 1];
                        if (lastBlock?.type === 'text') {
                            lastBlock.content += textToAdd;
                        } else {
                            blocks.push({ type: 'text', content: textToAdd });
                        }
                        contentBlocksRef.current = blocks;
                        setContentBlocks([...blocks]);
                        
                        chatMessages.updateMessageContent(
                            assistantMessageId,
                            streamingContentRef.current,
                            thinkingContentRef.current,
                            [...blocks]
                        );
                    },
                    onToolStart: (name, params) => {
                        console.log(`[useStreamingChat] Tool started: ${name}`, params);
                        // Add tool call block
                        const newBlock: ContentBlock = { type: 'tool_call', name, params, isComplete: false };
                        contentBlocksRef.current = [...contentBlocksRef.current, newBlock];
                        setContentBlocks([...contentBlocksRef.current]);
                        
                        chatMessages.updateMessageContent(
                            assistantMessageId,
                            streamingContentRef.current,
                            thinkingContentRef.current,
                            [...contentBlocksRef.current]
                        );
                    },
                    onToolEnd: (name, params, result, chatRenderHint) => {
                        console.log(`[useStreamingChat] Tool ended: ${name}`, params, result, chatRenderHint);
                        needsSpaceRef.current = true;
                        
                        // Update tool call block with params and result
                        const blocks = contentBlocksRef.current;
                        const toolBlock = [...blocks].reverse().find(
                            b => b.type === 'tool_call' && b.name === name && !b.isComplete
                        );
                        if (toolBlock && toolBlock.type === 'tool_call') {
                            toolBlock.params = params;
                            toolBlock.result = result;
                            toolBlock.isComplete = true;
                            if (chatRenderHint) {
                                toolBlock.chatRenderHint = chatRenderHint;
                            }
                            setContentBlocks([...blocks]);
                            
                            chatMessages.updateMessageContent(
                                assistantMessageId,
                                streamingContentRef.current,
                                thinkingContentRef.current,
                                [...blocks]
                            );
                        }
                    },
                    onStreamEnd: (finalConversationId, _title) => {
                        const finalContent  = streamingContentRef.current;
                        const finalThinking = thinkingContentRef.current;
                        const finalBlocks   = [...contentBlocksRef.current];

                        if (!skipUserMessage) {
                            chatMessages.updateMessageStatus(userMessageId, 'sent');
                        }

                        chatMessages.finalizeMessage(
                            assistantMessageId,
                            finalContent,
                            finalThinking,
                            'sent',
                            finalBlocks
                        );

                        if (finalConversationId !== chatMessages.conversationId) {
                            chatMessages.setConversationId(finalConversationId);
                            onConversationCreated(finalConversationId);
                        }

                        resetStreamingState();
                    },
                    onError: (errorMessage) => {
                        console.error("[useStreamingChat] Stream error:", errorMessage);

                        chatMessages.removeMessage(assistantMessageId);

                        if (!skipUserMessage) {
                            chatMessages.updateMessageStatus(userMessageId, 'failed', errorMessage);

                            showToast('Failed to send message', 'error', {
                                duration: 6000,
                                action: {
                                    label: 'Retry',
                                    onClick: () => {
                                        chatMessages.removeMessage(userMessageId);
                                        sendMessageRef.current(messageContent);
                                    }
                                }
                            });
                        } else {
                            showToast('Failed to regenerate response', 'error');
                        }

                        resetStreamingState();
                    }
                },
                projectId
            );

            abortControllerRef.current = abortController;

        } catch (error) {
            console.error("[useStreamingChat] Failed to start stream:", error);

            chatMessages.removeMessage(assistantMessageId);

            if (!skipUserMessage) {
                chatMessages.updateMessageStatus(userMessageId, 'failed', 'Failed to connect');
            } else {
                showToast('Failed to regenerate response', 'error');
            }

            resetStreamingState();
        }
    }, [
        api,
        chatModel.selectedModel,
        chatModel.currentProvider,
        chatMessages,
        onConversationCreated,
        showToast,
        resetStreamingState,
        projectId
    ]);


    // Keep sendMessageRef in sync
    useEffect(() => {
        sendMessageRef.current = sendMessage;
    }, [sendMessage]);


    const stopGeneration = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }

        const finalContent  = streamingContentRef.current;
        const finalThinking = thinkingContentRef.current;
        const finalBlocks   = [...contentBlocksRef.current];

        if (streamingMessageId) {
            chatMessages.finalizeMessage(
                streamingMessageId,
                finalContent || "_Generation cancelled by user._",
                finalThinking,
                'sent' as MessageStatus,
                finalBlocks
            );
        }

        setIsStreaming(false);
        setIsTyping(false);
        setIsRegenerating(false);
        setStreamingMessageId(null);
        setStreamingContent("");
        setThinkingContent("");
        setIsThinkingActive(false);
        setContentBlocks([]);
        thinkingContentRef.current  = "";
        streamingContentRef.current = "";
        contentBlocksRef.current    = [];
        currentThinkingRef.current  = "";
        needsSpaceRef.current       = false;
    }, [streamingMessageId, chatMessages]);


    const retryMessage = useCallback((messageId: number, content: string) => {
        chatMessages.removeMessage(messageId);
        sendMessageRef.current(content);
    }, [chatMessages]);


    const regenerateResponse = useCallback(async (messageIndex: number) => {
        const previousUserMessage = chatMessages.displayMessages
            .slice(0, messageIndex)
            .reverse()
            .find(msg => msg.role === "user");

        if (!previousUserMessage) {
            console.error("[useStreamingChat] Failed to find previous user message for regeneration");
            return;
        }

        setIsRegenerating(true);
        chatMessages.truncateToIndex(messageIndex);

        await sendMessageRef.current(previousUserMessage.content, undefined, false, true);

        setIsRegenerating(false);
    }, [chatMessages]);


    return {
        // State
        isStreaming,
        isTyping,
        isRegenerating,
        streamingMessageId,
        streamingContent,
        thinkingContent,
        isThinkingActive,
        contentBlocks,

        // Actions
        sendMessage,
        stopGeneration,
        retryMessage,
        regenerateResponse,
        sendMessageRef,
    };
}

export type UseStreamingChatReturn = ReturnType<typeof useStreamingChat>;
